<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockTransfer;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class StockTransferController extends Controller
{
    public function index()
    {
        // Tampilkan Riwayat Transfer
        $transfers = StockTransfer::with(['product', 'fromWarehouse', 'toWarehouse', 'user'])
            ->latest()
            ->paginate(10);

        return Inertia::render('StockTransfer/Index', [
            'transfers' => $transfers
        ]);
    }

    public function create()
    {
        // Generate Nomor Transfer Otomatis (TRF-YYYYMMDD-XXXX)
        $today = date('Ymd');
        $prefix = 'TRF-' . $today . '-';
        
        $lastTrf = StockTransfer::where('transfer_number', 'like', $prefix . '%')
            ->orderByRaw("CAST(SUBSTRING(transfer_number FROM " . (strlen($prefix) + 1) . ") AS INTEGER) DESC")
            ->first();

        $nextNumber = 1;
        if ($lastTrf) {
            $nextNumber = intval(substr($lastTrf->transfer_number, -4)) + 1;
        }

        $newTrfNumber = $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        return Inertia::render('StockTransfer/Create', [
            'newTrfNumber' => $newTrfNumber,
            'warehouses' => Warehouse::orderBy('name')->get(),
            'products' => Product::select('id', 'name', 'sku', 'unit')->orderBy('name')->get(), // Untuk dropdown
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'transfer_number' => 'required|unique:stock_transfers,transfer_number',
            'transfer_date' => 'required|date',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id', // Asal & Tujuan tidak boleh sama
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            foreach ($request->items as $item) {
                // 1. Cek Stok di Gudang ASAL
                $sourceStock = Stock::where('product_id', $item['product_id'])
                    ->where('warehouse_id', $request->from_warehouse_id)
                    ->first();

                // Validasi Stok Cukup
                if (!$sourceStock || $sourceStock->quantity < $item['quantity']) {
                    $prodName = Product::find($item['product_id'])->name;
                    throw ValidationException::withMessages([
                        'items' => "Stok '$prodName' di Gudang Asal tidak cukup. Sisa: " . ($sourceStock ? $sourceStock->quantity : 0)
                    ]);
                }

                // 2. Catat Riwayat Transfer
                StockTransfer::create([
                    'transfer_number' => $request->transfer_number,
                    'transfer_date' => $request->transfer_date,
                    'user_id' => auth()->id(),
                    'from_warehouse_id' => $request->from_warehouse_id,
                    'to_warehouse_id' => $request->to_warehouse_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'notes' => $request->notes,
                ]);

                // 3. Update Stok (Kurangi Asal, Tambah Tujuan)
                $sourceStock->decrement('quantity', $item['quantity']);

                $destStock = Stock::firstOrCreate(
                    ['product_id' => $item['product_id'], 'warehouse_id' => $request->to_warehouse_id],
                    ['quantity' => 0]
                );
                $destStock->increment('quantity', $item['quantity']);
            }

            DB::commit();
            return redirect()->route('stock-transfers.index')->with('success', 'Transfer stok berhasil!');

        } catch (\Exception $e) {
            DB::rollBack();
            if ($e instanceof ValidationException) throw $e;
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function getWarehouseStocks(Request $request, $warehouseId)
    {
        // Ambil stok yang quantity > 0 di gudang tersebut
        $stocks = \App\Models\Stock::where('warehouse_id', $warehouseId)
            ->where('quantity', '>', 0)
            ->with('product') // Load data produk (nama, sku, unit)
            ->get()
            ->map(function ($stock) {
                return [
                    'id' => $stock->product->id,
                    'name' => $stock->product->name,
                    'sku' => $stock->product->sku,
                    'unit' => $stock->product->unit,
                    'available_qty' => $stock->quantity // Kirim sisa stok agar bisa divalidasi di frontend
                ];
            });

        return response()->json($stocks);
    }
}