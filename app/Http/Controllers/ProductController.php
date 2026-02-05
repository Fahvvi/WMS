<?php

namespace App\Http\Controllers;

use App\Models\Product;
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
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%") // ilike = case insensitive di Postgres
                  ->orWhere('sku', 'ilike', "%{$query}%")
                  ->orWhere('barcode', 'ilike', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10) // Tampilkan 10 item per halaman
            ->withQueryString(); // Agar parameter search tidak hilang saat ganti halaman

        // Kirim data ke React (Frontend)
        return Inertia::render('Inventory/Index', [
            'products' => $products,
            'filters' => $request->only(['search']),
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
            'barcodeImage' => (string) $barcodeImage, // Cast ke string agar bisa dirender React
        ]);
    }

    public function store(Request $request)
    {
        // Validasi Sederhana
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku',
            'unit' => 'required|string|max:50',
        ]);

        // Simpan Produk
        $product = Product::create([
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            // Auto generate barcode jika kosong (sesuai logic Model)
            'unit' => $validated['unit'],
            'min_stock_alert' => 5, // Default
        ]);

        // Jika request dari AJAX (Modal), kembalikan JSON
        if ($request->wantsJson()) {
            return response()->json($product);
        }

        // Jika dari form biasa (masa depan), redirect balik
        return redirect()->back();
    }

    public function check(Request $request)
        {
            $code = $request->query('code');

            // Cari berdasarkan SKU atau Barcode
            $product = Product::where('sku', $code)
                        ->orWhere('barcode', $code)
                        ->first();

            if ($product) {
                return response()->json(['status' => 'found', 'product' => $product]);
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

            // Jika barcode kosong, biarkan yang lama atau generate baru (opsional)
            // Di sini kita update data sesuai input
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
}