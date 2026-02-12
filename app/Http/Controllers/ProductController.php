<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Picqer\Barcode\BarcodeGeneratorPNG;
use App\Models\StockTransferDetail;
use App\Models\TransactionDetail;
use App\Models\StockOpnameDetail;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->search) {
            $query->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('sku', 'ilike', "%{$request->search}%");
        }

        // UPDATE DI SINI: Tambahkan with('stocks.warehouse')
        $products = $query->with(['stocks.warehouse']) 
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Product/Index', [
            'products' => $products,
            'filters' => $request->only(['search']),
            'categories' => Category::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->get(),
        ]);
    }

    public function edit(Product $product)
    {
        // Security Check: Hanya user dengan izin 'edit_products'
        if (!auth()->user()->can('edit_products')) {
            abort(403, 'ANDA TIDAK MEMILIKI IZIN MENGEDIT PRODUK.');
        }

        return Inertia::render('Product/Edit', [ // Pastikan Anda punya file Page 'Product/Edit.jsx'
            'product' => $product,
            'categories' => Category::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        // SECURITY FIX: Pastikan hanya user dengan izin create_products yang bisa akses
        if (!auth()->user()->can('create_products')) abort(403, 'UNAUTHORIZED');

        // 1. Validasi
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:50', // Boleh kosong saat request
            'barcode' => 'nullable|string|max:50',
            'unit' => 'required|string|max:50',
            'category' => 'required|string|max:50',
        ]);

        // 2. Siapkan Variabel Penampung
        $finalSku = $request->sku;
        $finalBarcode = $request->barcode;

        // 3. LOGIC GENERATE (Jika SKU Kosong)
        if (empty($finalSku)) {
            
            // A. Ambil Kode Kategori
            $categoryObj = Category::where('name', $request->category)->first();
            $prefix = ($categoryObj && $categoryObj->code) ? $categoryObj->code : 'GEN';
            
            // B. Cari Nomor Urut Terakhir (PostgreSQL Compatible)
            // Logic: Ambil semua SKU yang depannya 'PREFIX-' lalu urutkan angkanya
            $lastProduct = Product::where('sku', 'like', $prefix . '-%')
                ->orderByRaw("CAST(SUBSTRING(sku FROM " . (strlen($prefix) + 2) . ") AS INTEGER) DESC")
                ->first();

            // C. Hitung Next Number
            $newNumber = 1;
            if ($lastProduct) {
                // PHP substr index 0-based. Panjang prefix + 1 (karakter strip '-')
                $lastNumber = intval(substr($lastProduct->sku, strlen($prefix) + 1));
                $newNumber = $lastNumber + 1;
            }

            // D. Rakit SKU Baru (Contoh: BT-00001)
            $finalSku = $prefix . '-' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
            
            // E. Jika Barcode kosong, samakan dengan SKU hasil generate
            if (empty($finalBarcode)) {
                $finalBarcode = $finalSku;
            }

        } 
        // 4. KASUS MANUAL (Jika User Isi SKU)
        else {
            if (empty($finalBarcode)) {
                $finalBarcode = $finalSku;
            }
        }

        // 5. CEK DUPLIKAT TERAKHIR (Safety Net)
        if (Product::where('sku', $finalSku)->exists()) {
            // Jika generate menghasilkan duplikat (race condition), minta user coba lagi
            return back()->withErrors(['sku' => "Gagal membuat SKU otomatis ($finalSku) karena sudah ada. Silakan coba lagi."]);
        }

        // 6. SIMPAN KE DATABASE
        $product = Product::create([
            'name' => $request->name,
            'sku' => $finalSku,       // PASTIKAN PAKAI VARIABEL $finalSku
            'barcode' => $finalBarcode, // PASTIKAN PAKAI VARIABEL $finalBarcode
            'unit' => $request->unit,
            'category' => $request->category,
            'min_stock_alert' => $request->min_stock_alert ?? 5,
        ]);

        if ($request->wantsJson()) {
            return response()->json($product);
        }

        return redirect()->back()->with('success', 'Material berhasil dibuat: ' . $product->sku);
    }

    public function update(Request $request, Product $product)
    {
        // SECURITY FIX: Pastikan hanya user dengan izin edit_products yang bisa akses
        if (!auth()->user()->can('edit_products')) abort(403, 'UNAUTHORIZED');

        // 1. VALIDASI UPDATE
        $request->validate([
            'name' => 'required|string|max:255',
            // Ignore ID sendiri agar tidak error "sudah ada" saat update diri sendiri
            'sku' => 'nullable|string|max:50|unique:products,sku,' . $product->id, 
            'barcode' => 'nullable|string|max:50',
            'unit' => 'required|string|max:50',
            'category' => 'nullable|string|max:50',
        ]);

        // 2. LOGIC UPDATE (Sama seperti Store)
        $finalSku = $request->sku;
        $finalBarcode = $request->barcode;

        // Jika user mengosongkan SKU saat edit -> Generate Baru
        if (empty($finalSku)) {
            $generatedCode = (string) mt_rand(100000000000, 999999999999);
            $finalSku = $generatedCode;
            
            if (empty($finalBarcode)) {
                $finalBarcode = $generatedCode;
            }
        } else {
            // Jika SKU ada, tapi Barcode dikosongkan user -> Samakan dengan SKU
            if (empty($finalBarcode)) {
                $finalBarcode = $finalSku;
            }
        }

        // 3. UPDATE DATABASE
        $product->update([
            'name' => $request->name,
            'sku' => $finalSku,
            'barcode' => $finalBarcode,
            'unit' => $request->unit,
            'category' => $request->category,
            'min_stock_alert' => $request->min_stock_alert,
        ]);

        return redirect()->back()->with('success', 'Material berhasil diperbarui.');
    }

    public function check(Request $request)
    {
        $code = $request->query('code');
        $warehouseId = $request->query('warehouse_id'); // Terima parameter warehouse_id
        
        $product = Product::where('sku', $code)
                    ->orWhere('barcode', $code)
                    ->first();

        if ($product) {
            // Cek stok spesifik di gudang ini
            $stockInWarehouse = 0;
            if ($warehouseId) {
                $stockInWarehouse = \App\Models\Stock::where('product_id', $product->id)
                    ->where('warehouse_id', $warehouseId)
                    ->value('quantity') ?? 0;
            }

            return response()->json([
                'status' => 'found', 
                'product' => $product,
                'current_stock' => (int) $stockInWarehouse // Kirim stok gudang, bukan stok global
            ]);
        }

        return response()->json(['status' => 'not_found', 'code' => $code]);
    }
    
    public function printLabel(Product $product, Request $request)
    {
        $type = $request->query('type', 'C128');
        $barcodeImage = null;

        if ($type === 'QR') {
            $barcodeImage = QrCode::size(150)->generate($product->barcode ?? $product->sku);
        } else {
            $generator = new BarcodeGeneratorPNG();
            $codeData = $product->barcode ?? $product->sku;
            $barcodeData = $generator->getBarcode($codeData, $generator::TYPE_CODE_128);
            $barcodeImage = '<img src="data:image/png;base64,' . base64_encode($barcodeData) . '">';
        }

        return Inertia::render('Inventory/PrintLabel', [
            'product' => $product,
            'barcodeType' => $type,
            'barcodeImage' => (string) $barcodeImage, 
        ]);
    }

    public function destroy(Product $product)
    {
        // SECURITY FIX: Pastikan hanya user dengan izin delete_products yang bisa akses
        if (!auth()->user()->can('delete_products')) abort(403, 'UNAUTHORIZED');

        $product->delete();
        return redirect()->back()->with('success', 'Produk berhasil dihapus.');
    }
    
    // Page History (Baru ditambahkan sebelumnya)
    public function history(Product $product)
    {
        // 1. Ambil Transaksi (Inbound/Outbound)
        $transactions = \App\Models\TransactionDetail::with(['transaction.warehouse', 'transaction.user'])
            ->where('product_id', $product->id)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'date' => $item->transaction->trx_date,
                    'type' => $item->transaction->type, // inbound / outbound
                    'quantity' => $item->transaction->type === 'outbound' ? -$item->quantity : $item->quantity,
                    'reference' => $item->transaction->trx_number,
                    'warehouse' => $item->transaction->warehouse->name,
                    'user' => $item->transaction->user->name,
                    'notes' => '-', // Bisa ditambah jika ada
                    'source' => 'transaction'
                ];
            });

        // 2. Ambil Transfer Stok (Keluar & Masuk)
        $transfers = \App\Models\StockTransferDetail::with(['transfer.fromWarehouse', 'transfer.toWarehouse', 'transfer.user'])
            ->where('product_id', $product->id)
            ->get()
            ->flatMap(function ($item) {
                $results = [];
                
                // Record Pengurangan (Dari Gudang Asal)
                $results[] = [
                    'id' => $item->id . '_out',
                    'date' => $item->transfer->transfer_date,
                    'type' => 'transfer_out',
                    'quantity' => -$item->quantity,
                    'reference' => $item->transfer->transfer_number,
                    'warehouse' => $item->transfer->fromWarehouse->name,
                    'user' => $item->transfer->user->name,
                    'notes' => 'Ke: ' . $item->transfer->toWarehouse->name,
                    'source' => 'transfer'
                ];

                // Record Penambahan (Ke Gudang Tujuan) - Hanya jika status completed/approved
                if ($item->transfer->status === 'approved' || $item->transfer->status === 'completed') {
                    $results[] = [
                        'id' => $item->id . '_in',
                        'date' => $item->transfer->transfer_date,
                        'type' => 'transfer_in',
                        'quantity' => $item->quantity,
                        'reference' => $item->transfer->transfer_number,
                        'warehouse' => $item->transfer->toWarehouse->name,
                        'user' => $item->transfer->user->name,
                        'notes' => 'Dari: ' . $item->transfer->fromWarehouse->name,
                        'source' => 'transfer'
                    ];
                }

                return $results;
            });

        // 3. Ambil Stock Opname (BARU)
        $opnames = \App\Models\StockOpnameDetail::with(['stockOpname.warehouse', 'stockOpname.user'])
            ->where('product_id', $product->id)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'date' => $item->stockOpname->opname_date,
                    'type' => 'stock_opname', // Tipe khusus untuk frontend
                    'quantity' => $item->difference, // Nilai selisih (+/-)
                    'reference' => $item->stockOpname->opname_number,
                    'warehouse' => $item->stockOpname->warehouse->name,
                    'user' => $item->stockOpname->user->name,
                    'notes' => "Fisik: {$item->physical_stock} (Sistem: {$item->system_stock})",
                    'source' => 'opname'
                ];
            });

        // Gabungkan semua, urutkan berdasarkan tanggal terbaru
        $history = $transactions
            ->concat($transfers)
            ->concat($opnames)
            ->sortByDesc('date')
            ->values();

        return Inertia::render('Inventory/History', [
            'product' => $product->load('category', 'unit'),
            'history' => $history
        ]);
    }
}
