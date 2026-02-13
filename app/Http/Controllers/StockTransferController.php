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
        // URUTKAN: Pending paling atas, lalu berdasarkan tanggal terbaru
        ->orderByRaw("CASE WHEN status = 'pending' THEN 1 ELSE 2 END")
        ->orderBy('created_at', 'desc')
        ->paginate(10)
        ->withQueryString();

    return Inertia::render('StockTransfer/Index', [
        'transfers' => $transfers,
        'filters' => $request->only(['search']),
    ]);
}

public function store(Request $request)
{
    if (!auth()->user()->can('create_transfers')) abort(403);

    // ... (Validasi request tetap sama) ...
    $request->validate([
        'transfer_number' => 'required|unique:stock_transfers,transfer_number',
        'transfer_date' => 'required|date',
        'from_warehouse_id' => 'required|exists:warehouses,id',
        'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
        'items' => 'required|array|min:1',
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
            'status' => 'pending', // <--- UBAH JADI PENDING
            'notes' => $request->notes
        ]);

        // 2. Simpan Detail (TANPA Pindah Stok)
        foreach ($request->items as $item) {
            StockTransferDetail::create([
                'stock_transfer_id' => $transfer->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity']
            ]);
        }

        DB::commit();
        return redirect()->route('stock-transfers.index')->with('success', 'Pengajuan transfer berhasil dibuat. Menunggu persetujuan.');

    } catch (\Exception $e) {
        DB::rollBack();
        return back()->withErrors(['error' => 'Gagal: ' . $e->getMessage()]);
    }
}

public function approve(StockTransfer $stockTransfer)
    {
        // Debugging: Cek status sebenarnya
        // dd($stockTransfer->status); 

        if (!auth()->user()->can('approve_transfers')) abort(403);
        
        // Pastikan pengecekan status menggunakan huruf kecil
        if ($stockTransfer->status !== 'pending') {
            return back()->with('error', 'Transfer sudah diproses atau status tidak valid.');
        }

        try {
            DB::beginTransaction();

            // Gunakan $stockTransfer->details, bukan $transfer->details
            foreach ($stockTransfer->details as $item) {
                
                // ... logic kurangi stok (Copy dari kode sebelumnya) ...
                
                // Cek stok asal
                $currentStock = Stock::where('warehouse_id', $stockTransfer->from_warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->value('quantity');

                if (!$currentStock || $currentStock < $item->quantity) {
                    throw new \Exception("Stok barang (ID: {$item->product_id}) tidak cukup.");
                }

                // 1. Kurangi Asal
                Stock::where('warehouse_id', $stockTransfer->from_warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->decrement('quantity', $item->quantity);

                // 2. Tambah Tujuan
                $destStock = Stock::firstOrCreate(
                    ['warehouse_id' => $stockTransfer->to_warehouse_id, 'product_id' => $item->product_id],
                    ['quantity' => 0]
                );
                $destStock->increment('quantity', $item->quantity);
            }

            // Update Status
            $stockTransfer->update(['status' => 'completed']);

            DB::commit();
            return back()->with('success', 'Transfer disetujui & stok berhasil dipindahkan.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    // Lakukan hal yang sama untuk reject
    public function reject(StockTransfer $stockTransfer)
    {
        if (!auth()->user()->can('approve_transfers')) abort(403);
        if ($stockTransfer->status !== 'pending') return back()->with('error', 'Status tidak valid.');

        $stockTransfer->update(['status' => 'rejected']);
        return back()->with('success', 'Pengajuan transfer ditolak.');
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
                    // PERBAIKAN DI SINI:
                    'id' => $stock->product_id, // Frontend butuh 'id' untuk value dropdown
                    'product_id' => $stock->product_id, 
                    'name' => $stock->product->name,
                    'sku' => $stock->product->sku,
                    'available_qty' => $stock->quantity, // Frontend butuh 'available_qty' untuk validasi max input
                    'unit' => $stock->product->unit ?? 'Pcs', // Frontend butuh 'unit' untuk label
                ];
            });

        return response()->json($stocks);
    }

    
}