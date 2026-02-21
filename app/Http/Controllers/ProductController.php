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
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProductsExport;
use App\Imports\ProductsImport;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('search');

        $products = Product::query()
            // 1. Ambil relasi stocks dan location-nya
            ->with(['stocks.location', 'stocks.warehouse']) 
            // 2. Hitung total qty (ini sepertinya sudah ada di kode Anda)
            ->withSum('stocks as stocks_sum_quantity', 'quantity') 
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('sku', 'ilike', "%{$query}%")
                  ->orWhere('barcode', 'ilike', "%{$query}%")
                  ->orWhere('category', 'ilike', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Product/Index', [ // Sesuaikan path render Anda
            'products' => $products,
            'filters' => $request->only(['search']),
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
        if (!auth()->user()->can('view_products')) abort(403);

        // 1. Ambil Transaksi Biasa (Inbound/Outbound)
        $transactions = \App\Models\TransactionDetail::with(['transaction.user', 'transaction.warehouse'])
            ->where('product_id', $product->id)
            ->get()
            ->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'type' => $detail->transaction->type, // inbound / outbound
                    'date' => $detail->transaction->trx_date,
                    'reference' => $detail->transaction->trx_number,
                    'quantity' => $detail->quantity,
                    'user' => $detail->transaction->user->name ?? 'Unknown',
                    'warehouse' => $detail->transaction->warehouse->name ?? '-',
                    'notes' => $detail->transaction->notes, // Ambil catatan transaksi
                    'timestamp' => $detail->created_at,
                ];
            });

        // 2. Ambil Stock Transfer (Pindah Gudang)
        // Kita perlu memecah ini menjadi dua sisi: Masuk (IN) dan Keluar (OUT)
        // Karena history per produk harus jelas gudang mana yang bertambah/berkurang
        
        $transfers = \App\Models\StockTransferDetail::with(['transfer.user', 'transfer.fromWarehouse', 'transfer.toWarehouse'])
            ->where('product_id', $product->id)
            ->whereHas('transfer', function($q) {
                $q->where('status', 'completed'); // Hanya yang sudah selesai
            })
            ->get()
            ->flatMap(function ($detail) {
                // Return dua record untuk history (Satu keluar dari asal, Satu masuk ke tujuan)
                // ATAU cukup satu record tergantung konteks gudang mana yang dilihat.
                // Tapi karena ini History Produk (Global), kita tampilkan sebagai "Transfer"
                
                return [
                    [
                        'id' => $detail->id . '_out',
                        'type' => 'transfer_out',
                        'date' => $detail->transfer->transfer_date,
                        'reference' => $detail->transfer->transfer_number,
                        'quantity' => $detail->quantity, // Keluar = Negatif secara logika display
                        'user' => $detail->transfer->user->name ?? 'Unknown',
                        'warehouse' => $detail->transfer->fromWarehouse->name, // Gudang Asal
                        'notes' => $detail->transfer->notes, // <--- TAMBAHKAN INI
                        'timestamp' => $detail->created_at,
                    ],
                    [
                        'id' => $detail->id . '_in',
                        'type' => 'transfer_in',
                        'date' => $detail->transfer->transfer_date,
                        'reference' => $detail->transfer->transfer_number,
                        'quantity' => $detail->quantity, // Masuk = Positif
                        'user' => $detail->transfer->user->name ?? 'Unknown',
                        'warehouse' => $detail->transfer->toWarehouse->name, // Gudang Tujuan
                        'notes' => $detail->transfer->notes, // <--- TAMBAHKAN INI
                        'timestamp' => $detail->created_at,
                    ]
                ];
            });

        // 3. Ambil Stock Opname (Penyesuaian)
        $opnames = \App\Models\StockOpnameDetail::with(['opname.user', 'opname.warehouse'])
            ->where('product_id', $product->id)
            ->whereHas('opname', function($q) {
                $q->where('status', 'completed');
            })
            ->get()
            ->map(function ($detail) {
                $selisih = $detail->actual_qty - $detail->system_qty;
                return [
                    'id' => $detail->id,
                    'type' => 'stock_opname',
                    'date' => $detail->opname->opname_date,
                    'reference' => $detail->opname->opname_number,
                    'quantity' => $selisih, // Bisa plus/minus
                    'user' => $detail->opname->user->name ?? 'Unknown',
                    'warehouse' => $detail->opname->warehouse->name ?? '-',
                    'notes' => $detail->opname->notes ?? 'Penyesuaian Stok (Audit)', // <--- Ambil Notes Opname
                    'timestamp' => $detail->created_at,
                ];
            });

        // Gabungkan semua, urutkan berdasarkan waktu, lalu paginate manual
        $allHistory = $transactions->concat($transfers)->concat($opnames)->sortByDesc('timestamp')->values();

        // Manual Pagination (Karena kita menggabungkan collection)
        $perPage = 10;
        $page = request()->get('page', 1);
        $paginatedHistory = new \Illuminate\Pagination\LengthAwarePaginator(
            $allHistory->forPage($page, $perPage)->values(),
            $allHistory->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );

        return Inertia::render('Inventory/History', [
            'product' => $product,
            'history' => $paginatedHistory
        ]);
    }

        public function export() {
            if (!auth()->user()->can('export_products')) abort(403);
            return Excel::download(new ProductsExport, 'products_'.date('Y-m-d').'.xlsx');
        }

        public function import(Request $request) 
        {
            if (!auth()->user()->can('import_products')) abort(403);
            
            $request->validate([
                'file' => 'required|mimes:xlsx,xls,csv'
            ]);

            try {
                Excel::import(new ProductsImport, $request->file('file'));
                return back()->with('success', 'Data Berhasil Diimpor!');
            } catch (\Exception $e) {
                return back()->with('error', 'Gagal Impor: ' . $e->getMessage());
        }
}
}
