<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\StockTransfer;
use App\Models\StockTransferDetail;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        // --- SECURITY CHECK (VIEW) ---
        if (!auth()->user()->can('view_transfers')) {
            abort(403, 'ANDA TIDAK MEMILIKI AKSES KE HALAMAN TRANSFER STOK.');
        }
        // -----------------------------

        $query = $request->input('search');

        $transfers = StockTransfer::with(['fromWarehouse', 'toWarehouse', 'user'])
            ->withCount('details') 
            ->when($query, function ($q) use ($query) {
                $q->where('transfer_number', 'ilike', "%{$query}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('StockTransfer/Index', [
            'transfers' => $transfers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        // --- SECURITY CHECK (CREATE) ---
        if (!auth()->user()->can('create_transfers')) {
            abort(403, 'ANDA TIDAK BERHAK MEMBUAT TRANSFER STOK.');
        }
        // -------------------------------

        // Generate Nomor Transfer Otomatis (TF-YYYYMMDD-XXXX)
        $today = date('Ymd');
        $prefix = 'TF-' . $today . '-';
        
        $lastTransfer = StockTransfer::where('transfer_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = 1;
        if ($lastTransfer) {
            $lastNumber = intval(substr($lastTransfer->transfer_number, -4));
            $nextNumber = $lastNumber + 1;
        }

        $newTransferNumber = $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        return Inertia::render('StockTransfer/Create', [
            'newTransferNumber' => $newTransferNumber,
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(),
            'products' => Product::orderBy('name')->get() 
        ]);
    }

    // API Helper: Ambil stok barang di gudang asal
    public function getWarehouseStocks(Warehouse $warehouse)
    {
        // --- SECURITY CHECK (API) ---
        // Mencegah user iseng nembak API stok gudang lain
        if (!auth()->user()->can('create_transfers')) {
            abort(403, 'Unauthorized access to warehouse stocks.');
        }
        // ----------------------------

        $stocks = Stock::with('product')
            ->where('warehouse_id', $warehouse->id)
            ->where('quantity', '>', 0)
            ->get()
            ->map(function ($stock) {
                return [
                    'product_id' => $stock->product_id,
                    'name' => $stock->product->name,
                    'sku' => $stock->product->sku,
                    'quantity' => $stock->quantity
                ];
            });

        return response()->json($stocks);
    }

    public function store(Request $request)
    {
        // --- SECURITY CHECK (STORE) ---
        if (!auth()->user()->can('create_transfers')) {
            abort(403, 'TINDAKAN DITOLAK: TIDAK ADA IZIN CREATE TRANSFER');
        }
        // ------------------------------

        $request->validate([
            'transfer_number' => 'required|unique:stock_transfers,transfer_number',
            'transfer_date' => 'required|date',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            // 1. Validasi Stok Terlebih Dahulu (Double Check)
            foreach ($request->items as $item) {
                $currentStock = Stock::where('warehouse_id', $request->from_warehouse_id)
                    ->where('product_id', $item['product_id'])
                    ->value('quantity');

                if (!$currentStock || $currentStock < $item['quantity']) {
                    $productName = Product::find($item['product_id'])->name;
                    throw ValidationException::withMessages([
                        'items' => "Stok '$productName' tidak mencukupi di gudang asal. Sisa: " . ($currentStock ?? 0)
                    ]);
                }
            }

            // 2. Buat Header Transfer
            $transfer = StockTransfer::create([
                'user_id' => auth()->id(),
                'transfer_number' => $request->transfer_number,
                'transfer_date' => $request->transfer_date,
                'from_warehouse_id' => $request->from_warehouse_id,
                'to_warehouse_id' => $request->to_warehouse_id,
                'status' => 'completed', 
                'notes' => $request->notes
            ]);

            // 3. Proses Item & Mutasi Stok
            foreach ($request->items as $item) {
                // Simpan Detail
                StockTransferDetail::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity']
                ]);

                // Kurangi Stok Gudang ASAL
                Stock::where('warehouse_id', $request->from_warehouse_id)
                    ->where('product_id', $item['product_id'])
                    ->decrement('quantity', $item['quantity']);

                // Tambah Stok Gudang TUJUAN
                $destStock = Stock::firstOrCreate(
                    ['warehouse_id' => $request->to_warehouse_id, 'product_id' => $item['product_id']],
                    ['quantity' => 0]
                );
                $destStock->increment('quantity', $item['quantity']);
            }

            DB::commit();

            return redirect()->route('stock-transfers.index')
                ->with('success', 'Transfer stok berhasil diproses.');

        } catch (\Exception $e) {
            DB::rollBack();
            if ($e instanceof ValidationException) {
                throw $e;
            }
            return back()->withErrors(['error' => 'Gagal memproses transfer: ' . $e->getMessage()]);
        }
    }
}