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
        if (!auth()->user()->can('view_transfers')) abort(403);

        $query = $request->input('search');

        $transfers = StockTransfer::with(['fromWarehouse', 'toWarehouse', 'user'])
            ->withCount('details')
            ->when($query, function ($q) use ($query) {
                $q->where('transfer_number', 'ilike', "%{$query}%");
            })
            ->orderByRaw("CASE WHEN status = 'pending' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('StockTransfer/Index', [
            'transfers' => $transfers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        if (!auth()->user()->can('create_transfers')) {
            abort(403, 'ANDA TIDAK BERHAK MEMBUAT TRANSFER STOK.');
        }

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
            // Kirim relasi locations agar di frontend dropdown bisa milih rak
            'warehouses' => Warehouse::with('locations')->where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    // [UPDATED] API Ambil Stok: Sekarang memecah stok per Rak
    public function getWarehouseStocks(Warehouse $warehouse)
    {
        if (!auth()->user()->can('create_transfers')) abort(403);

        $stocks = Stock::with(['product', 'location'])
            ->where('warehouse_id', $warehouse->id)
            ->where('quantity', '>', 0)
            ->get()
            ->map(function ($stock) {
                return [
                    'stock_id' => $stock->id, 
                    'product_id' => $stock->product_id, 
                    'name' => $stock->product->name,
                    'sku' => $stock->product->sku,
                    'location_id' => $stock->location_id,
                    'location_code' => $stock->location ? $stock->location->code : 'Tanpa Rak',
                    'available_qty' => $stock->quantity,
                    'unit' => $stock->product->unit ?? 'Pcs',
                ];
            });

        return response()->json($stocks);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->can('create_transfers')) abort(403);

        $request->validate([
            'transfer_number' => 'required|unique:stock_transfers,transfer_number',
            'transfer_date' => 'required|date',
            'from_warehouse_id' => 'required|exists:warehouses,id',
            // rule 'different:from_warehouse_id' dihapus agar bisa mutasi antar rak di 1 gudang
            'to_warehouse_id' => 'required|exists:warehouses,id', 
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.from_location_id' => 'nullable|exists:locations,id',
            'items.*.to_location_id' => 'nullable|exists:locations,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            // 1. Simpan Header (Status PENDING)
            $transfer = StockTransfer::create([
                'user_id' => auth()->id(),
                'transfer_number' => $request->transfer_number,
                'transfer_date' => $request->transfer_date,
                'from_warehouse_id' => $request->from_warehouse_id,
                'to_warehouse_id' => $request->to_warehouse_id,
                'status' => 'pending', 
                'notes' => $request->notes
            ]);

            // 2. Simpan Detail
            foreach ($request->items as $item) {
                // Keamanan: Cegah pindah ke tempat yang sama persis (Gudang sama + Rak sama)
                if ($request->from_warehouse_id == $request->to_warehouse_id && 
                    ($item['from_location_id'] ?? null) == ($item['to_location_id'] ?? null)) {
                    throw ValidationException::withMessages([
                        'items' => "Tidak bisa memindahkan barang ke titik rak yang sama persis."
                    ]);
                }

                StockTransferDetail::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'from_location_id' => $item['from_location_id'] ?? null,
                    'to_location_id' => $item['to_location_id'] ?? null,
                    'quantity' => $item['quantity']
                ]);
            }

            DB::commit();
            return redirect()->route('stock-transfers.index')->with('success', 'Pengajuan transfer berhasil dibuat.');

        } catch (\Exception $e) {
            DB::rollBack();
            if ($e instanceof ValidationException) throw $e;
            return back()->withErrors(['error' => 'Gagal: ' . $e->getMessage()]);
        }
    }

    public function approve(StockTransfer $stockTransfer)
    {
        if (!auth()->user()->can('approve_transfers')) abort(403);
        
        if ($stockTransfer->status !== 'pending') {
            return back()->with('error', 'Transfer sudah diproses atau status tidak valid.');
        }

        try {
            DB::beginTransaction();

            foreach ($stockTransfer->details as $item) {
                // Cek stok asal (di gudang & rak spesifik)
                $stockQuery = Stock::where('warehouse_id', $stockTransfer->from_warehouse_id)
                    ->where('product_id', $item->product_id);
                
                if ($item->from_location_id) {
                    $stockQuery->where('location_id', $item->from_location_id);
                } else {
                    $stockQuery->whereNull('location_id');
                }

                $currentStock = $stockQuery->value('quantity') ?? 0;

                if ($currentStock < $item->quantity) {
                    throw new \Exception("Stok barang (ID: {$item->product_id}) di lokasi asal tidak cukup.");
                }

                // 1. Kurangi Asal
                if ($item->from_location_id) {
                    Stock::where('warehouse_id', $stockTransfer->from_warehouse_id)->where('product_id', $item->product_id)->where('location_id', $item->from_location_id)->decrement('quantity', $item->quantity);
                } else {
                    Stock::where('warehouse_id', $stockTransfer->from_warehouse_id)->where('product_id', $item->product_id)->whereNull('location_id')->decrement('quantity', $item->quantity);
                }

                // 2. Tambah Tujuan (Buat row baru jika belum ada kombinasi Gudang+Rak tersebut)
                $destStock = Stock::firstOrCreate(
                    [
                        'warehouse_id' => $stockTransfer->to_warehouse_id, 
                        'product_id' => $item->product_id, 
                        'location_id' => $item->to_location_id
                    ],
                    ['quantity' => 0]
                );
                $destStock->increment('quantity', $item->quantity);
            }

            $stockTransfer->update(['status' => 'completed']);

            DB::commit();
            return back()->with('success', 'Transfer disetujui & stok berhasil dipindahkan.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    public function reject(StockTransfer $stockTransfer)
    {
        if (!auth()->user()->can('approve_transfers')) abort(403);
        if ($stockTransfer->status !== 'pending') return back()->with('error', 'Status tidak valid.');

        $stockTransfer->update(['status' => 'rejected']);
        return back()->with('success', 'Pengajuan transfer ditolak.');
    }
}