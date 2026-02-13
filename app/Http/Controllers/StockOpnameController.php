<?php

namespace App\Http\Controllers;

use App\Models\StockOpname;
use App\Models\StockOpnameDetail;
use App\Models\Stock;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockOpnameController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->can('view_stock_opname')) abort(403);

        $query = $request->input('search');

        $opnames = StockOpname::with(['warehouse', 'user'])
            ->withCount('details')
            ->when($query, function ($q) use ($query) {
                $q->where('opname_number', 'ilike', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('StockOpname/Index', [
            'opnames' => $opnames,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        if (!auth()->user()->can('create_stock_opname')) abort(403);

        // Generate Nomor Otomatis: SO-YYYYMMDD-001
        $today = date('Ymd');
        $lastOpname = StockOpname::whereDate('created_at', today())->latest()->first();
        $sequence = $lastOpname ? intval(substr($lastOpname->opname_number, -3)) + 1 : 1;
        $newOpnameNumber = 'SO-' . $today . '-' . str_pad($sequence, 3, '0', STR_PAD_LEFT);

        return Inertia::render('StockOpname/Create', [
            'newOpnameNumber' => $newOpnameNumber,
            'warehouses' => Warehouse::all(),
        ]);
    }

    // API Helper: Ambil stok sistem saat ini untuk form opname
    public function getWarehouseStockSnapshot(Warehouse $warehouse)
    {
        if (!auth()->user()->can('create_stock_opname')) abort(403);

        // Ambil semua produk, join dengan stok di gudang tersebut
        // Jika tidak ada record stok, anggap 0
        $products = Product::leftJoin('stocks', function($join) use ($warehouse) {
            $join->on('products.id', '=', 'stocks.product_id')
                 ->where('stocks.warehouse_id', '=', $warehouse->id);
        })
        ->select(
            'products.id', 
            'products.name', 
            'products.sku', 
            'products.unit',
            DB::raw('COALESCE(stocks.quantity, 0) as system_qty')
        )
        ->orderBy('products.name')
        ->get();

        return response()->json($products);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->can('create_stock_opname')) abort(403);

        $request->validate([
            'opname_number' => 'required|unique:stock_opnames,opname_number',
            'opname_date' => 'required|date',
            'warehouse_id' => 'required|exists:warehouses,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.actual_qty' => 'required|integer|min:0',
        ]);

        try {
            DB::beginTransaction();

            // 1. Buat Header Opname
            $opname = StockOpname::create([
                'opname_number' => $request->opname_number,
                'opname_date' => $request->opname_date,
                'warehouse_id' => $request->warehouse_id,
                'user_id' => auth()->id(),
                'status' => 'completed', // Langsung selesai karena ini hasil perhitungan fisik
                'notes' => $request->notes,
            ]);

            // 2. Proses Detail & Update Stok
            foreach ($request->items as $item) {
                // Ambil stok sistem TERBARU untuk akurasi
                $currentStock = Stock::where('warehouse_id', $request->warehouse_id)
                    ->where('product_id', $item['product_id'])
                    ->first();
                
                $systemQty = $currentStock ? $currentStock->quantity : 0;
                $actualQty = $item['actual_qty'];

                // Simpan history detail opname
                StockOpnameDetail::create([
                    'stock_opname_id' => $opname->id,
                    'product_id' => $item['product_id'],
                    'system_qty' => $systemQty,
                    'actual_qty' => $actualQty,
                    'notes' => $item['notes'] ?? null,
                ]);

                // UPDATE STOK UTAMA (Overwrite dengan Actual Qty)
                // Kita gunakan updateOrCreate agar jika record stok belum ada, akan dibuat
                Stock::updateOrCreate(
                    ['warehouse_id' => $request->warehouse_id, 'product_id' => $item['product_id']],
                    ['quantity' => $actualQty]
                );
            }

            DB::commit();
            return redirect()->route('stock-opnames.index')->with('success', 'Stock Opname berhasil disimpan & stok diperbarui.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan opname: ' . $e->getMessage()]);
        }
    }

    public function show(StockOpname $stockOpname)
    {
        if (!auth()->user()->can('view_stock_opname')) abort(403);

        // Muat relasi yang dibutuhkan: Gudang, User pembuat, dan Detail Barang+Produknya
        $stockOpname->load(['warehouse', 'user', 'details.product']);

        return Inertia::render('StockOpname/Show', [
            'opname' => $stockOpname
        ]);
    }
}