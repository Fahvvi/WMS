<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use App\Models\StockOpname;
use App\Models\StockOpnameDetail;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockOpnameController extends Controller
{
    public function index()
    {
        $opnames = StockOpname::with(['warehouse', 'user'])
            ->latest()
            ->paginate(10); // WAJIB PAKAI PAGINATE agar ada properti .data

        return Inertia::render('StockOpname/Index', [
            'opnames' => $opnames
        ]);
    }

    public function create()
    {
        if (!auth()->user()->can('view_stock_opname')) abort(403);

        // Generate Nomor SO Otomatis
        $nextNumber = 'SO-' . date('Ymd') . '-' . str_pad(StockOpname::count() + 1, 4, '0', STR_PAD_LEFT);

        return Inertia::render('StockOpname/Create', [
            'warehouses' => Warehouse::all(),
            'nextNumber' => $nextNumber
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'items' => 'required|array|min:1',
            'opname_number' => 'required|unique:stock_opnames,opname_number',
        ]);

        try {
            DB::beginTransaction();

            $opname = StockOpname::create([
                'opname_number' => $request->opname_number,
                'warehouse_id' => $request->warehouse_id,
                'user_id' => auth()->id(),
                'opname_date' => now(),
                'notes' => $request->notes ?? '-'
            ]);

            foreach ($request->items as $item) {
                $diff = $item['physical_stock'] - $item['system_stock'];

                StockOpnameDetail::create([
                    'stock_opname_id' => $opname->id,
                    'product_id' => $item['product_id'],
                    'system_stock' => $item['system_stock'],
                    'physical_stock' => $item['physical_stock'],
                    'difference' => $diff,
                ]);

                // --- UPDATE STOK REAL ---
                // Kita samakan stok di tabel Stock dengan hasil perhitungan fisik
                Stock::updateOrCreate(
                    ['warehouse_id' => $request->warehouse_id, 'product_id' => $item['product_id']],
                    ['quantity' => $item['physical_stock']]
                );
            }

            DB::commit();
            return redirect()->route('stock-opnames.index')->with('success', 'Stock Opname berhasil disimpan & stok diperbarui.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal simpan: ' . $e->getMessage()]);
        }
    }
}