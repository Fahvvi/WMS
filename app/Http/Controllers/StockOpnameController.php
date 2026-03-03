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

        $today = date('Ymd');
        $lastOpname = StockOpname::whereDate('created_at', today())->latest()->first();
        $sequence = $lastOpname ? intval(substr($lastOpname->opname_number, -3)) + 1 : 1;
        $newOpnameNumber = 'SO-' . $today . '-' . str_pad($sequence, 3, '0', STR_PAD_LEFT);

        return Inertia::render('StockOpname/Create', [
            'newOpnameNumber' => $newOpnameNumber,
            'warehouses' => Warehouse::all(),
        ]);
    }

    // [UPDATED] Snapshot sekarang mengambil stok per RAK
    public function getWarehouseStockSnapshot(Warehouse $warehouse)
    {
        if (!auth()->user()->can('create_stock_opname')) abort(403);

        $stocks = Stock::with(['product', 'location'])
            ->where('warehouse_id', $warehouse->id)
            ->get()
            ->map(function ($stock) {
                return [
                    'stock_id' => $stock->id,
                    'product_id' => $stock->product_id,
                    'location_id' => $stock->location_id,
                    'location_code' => $stock->location ? $stock->location->code : 'Tanpa Rak',
                    'name' => $stock->product->name,
                    'sku' => $stock->product->sku,
                    'unit' => $stock->product->unit ?? 'Pcs',
                    'system_qty' => $stock->quantity,
                ];
            });

        return response()->json($stocks);
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
            'items.*.location_id' => 'nullable|exists:locations,id', // Validasi rak
            'items.*.actual_qty' => 'required|integer|min:0',
        ]);

        try {
            DB::beginTransaction();

            $opname = StockOpname::create([
                'opname_number' => $request->opname_number,
                'opname_date' => $request->opname_date,
                'warehouse_id' => $request->warehouse_id,
                'user_id' => auth()->id(),
                'status' => 'completed', 
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                // Ambil stok sistem TERBARU per Rak
                $currentStock = Stock::where('warehouse_id', $request->warehouse_id)
                    ->where('product_id', $item['product_id'])
                    ->where('location_id', $item['location_id'] ?? null)
                    ->first();
                
                $systemQty = $currentStock ? $currentStock->quantity : 0;
                $actualQty = $item['actual_qty'];

                StockOpnameDetail::create([
                    'stock_opname_id' => $opname->id,
                    'product_id' => $item['product_id'],
                    'location_id' => $item['location_id'] ?? null, // Simpan info rak
                    'system_qty' => $systemQty,
                    'actual_qty' => $actualQty,
                    'notes' => $item['notes'] ?? null,
                ]);

                // UPDATE STOK UTAMA BERDASARKAN RAK
                Stock::updateOrCreate(
                    [
                        'warehouse_id' => $request->warehouse_id, 
                        'product_id' => $item['product_id'],
                        'location_id' => $item['location_id'] ?? null
                    ],
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

        // Muat relasi location di dalam details
        $stockOpname->load(['warehouse', 'user', 'details.product', 'details.location']);

        return Inertia::render('StockOpname/Show', [
            'opname' => $stockOpname
        ]);
    }
}