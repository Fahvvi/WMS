<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category; // <--- Penting untuk Dropdown
use App\Models\Unit;     // <--- Penting untuk Dropdown
use Illuminate\Http\Request;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Picqer\Barcode\BarcodeGeneratorPNG;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        // Ambil input pencarian user
        $query = $request->input('search');

        // Query ke database dengan filter (jika ada search)
        $products = Product::query()
            ->withSum('stocks', 'quantity') // Hitung total stok dari tabel stocks
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%") 
                  ->orWhere('sku', 'ilike', "%{$query}%")
                  ->orWhere('barcode', 'ilike', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10) 
            ->withQueryString();

        // Kirim data ke React (Frontend)
        return Inertia::render('Inventory/Index', [
            'products' => $products,
            'filters' => $request->only(['search']),
            // Kirim data master untuk Dropdown (Datalist)
            'categories' => Category::orderBy('name')->pluck('name'),
            'units' => Unit::orderBy('name')->pluck('name'),
        ]);
    }

    public function printLabel(Product $product, Request $request)
    {
        // Ambil input tipe barcode dari URL ?type=QR atau ?type=C128
        $type = $request->query('type', 'C128'); // Default Code 128
        $barcodeImage = null;

        if ($type === 'QR') {
            // Generate QR Code (Output SVG agar tajam saat diprint)
            $barcodeImage = QrCode::size(150)->generate($product->barcode ?? $product->sku);
        } else {
            // Generate Code 128 (Barcode Batang)
            $generator = new BarcodeGeneratorPNG();
            $barcodeData = $generator->getBarcode($product->barcode ?? $product->sku, $generator::TYPE_CODE_128);
            $barcodeImage = '<img src="data:image/png;base64,' . base64_encode($barcodeData) . '">';
        }

        return Inertia::render('Inventory/PrintLabel', [
            'product' => $product,
            'barcodeType' => $type,
            'barcodeImage' => (string) $barcodeImage, 
        ]);
    }

    public function store(Request $request)
    {
        // 1. Validasi awal (SKU boleh kosong dulu/nullable)
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:50', // Boleh kosong, nanti kita isi
            'unit' => 'required|string|max:50',
            'category' => 'nullable|string|max:50',
        ]);

        $sku = $request->sku;
        $barcode = $request->barcode;

        // 2. Logic Generasi SKU & Barcode
        if (empty($sku)) {
            // Jika SKU Kosong -> Generate Barcode Angka -> Jadikan SKU
            $generatedCode = mt_rand(100000000000, 999999999999); // 12 Digit Angka
            $sku = (string)$generatedCode;
            $barcode = (string)$generatedCode; // SKU dan Barcode SAMA
        } else {
            // Jika SKU Diisi tapi Barcode Kosong -> Barcode ikut SKU
            if (empty($barcode)) {
                $barcode = $sku;
            }
        }

        // 3. Cek Unik Manual (Karena tadi validasi 'nullable')
        if (Product::where('sku', $sku)->exists()) {
            return back()->withErrors(['sku' => 'SKU/Barcode yang dihasilkan sudah ada. Silakan coba lagi.']);
        }

        // 4. Simpan
        $product = Product::create([
            'name' => $request->name,
            'sku' => $sku,
            'barcode' => $barcode,
            'unit' => $request->unit,
            'category' => $request->category,
            'min_stock_alert' => $request->min_stock_alert ?? 5,
        ]);

        if ($request->wantsJson()) {
            return response()->json($product);
        }

        return redirect()->back()->with('success', 'Material berhasil dibuat: ' . $product->name);
    }

    public function check(Request $request)
    {
        $code = $request->query('code');

        // Cari produk beserta relasi stok-nya
        $product = Product::withSum('stocks', 'quantity') // <--- Hitung total stok
                    ->where('sku', $code)
                    ->orWhere('barcode', $code)
                    ->first();

        if ($product) {
            return response()->json([
                'status' => 'found', 
                'product' => $product,
                // Kirim angka stok saat ini ke frontend untuk validasi Outbound
                'current_stock' => (int) $product->stocks_sum_quantity 
            ]);
        }

        return response()->json(['status' => 'not_found', 'code' => $code]);
    }

    // UPDATE: Untuk mengedit detail produk
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            // Ignore ID sendiri saat cek unique SKU
            'sku' => 'required|string|max:50|unique:products,sku,' . $product->id,
            'barcode' => 'nullable|string|max:50',
            'unit' => 'required|string|max:20',
            'category' => 'nullable|string|max:50',
            'min_stock_alert' => 'required|integer|min:0',
        ]);

        // Update data sesuai input
        $product->update($validated);

        return redirect()->back()->with('success', 'Produk berhasil diperbarui.');
    }

    // DESTROY: Hapus produk
    public function destroy(Product $product)
    {
        // Cek dulu apakah barang ini punya stok atau history transaksi?
        // Untuk keamanan data, biasanya dilarang hapus jika sudah ada transaksi.
        // Tapi untuk tahap development, kita izinkan hapus dulu.
        
        $product->delete();

        return redirect()->back()->with('success', 'Produk berhasil dihapus.');
    }

    // PAGE: History Transaksi per Barang
    public function history(Product $product)
    {
        // Ambil detail transaksi yang melibatkan produk ini
        $history = \App\Models\TransactionDetail::with(['transaction.user', 'transaction.warehouse'])
            ->where('product_id', $product->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Inventory/History', [
            'product' => $product,
            'history' => $history,
        ]);
    }
}