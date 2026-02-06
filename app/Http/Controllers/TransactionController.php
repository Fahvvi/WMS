<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Warehouse;
use App\Models\Unit; // <--- Penting: Import Model Unit
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->input('type', 'inbound');
        $query = $request->input('search');

        $transactions = Transaction::with(['user', 'warehouse'])
            // TAMBAHAN 1: Ambil detail produk untuk cek Kategori nanti
            ->with(['details.product']) 
            // TAMBAHAN 2: Hitung otomatis total quantity dari tabel details
            ->withSum('details', 'quantity') 
            ->where('type', $type)
            ->when($query, function ($q) use ($query) {
                $q->where('trx_number', 'ilike', "%{$query}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Transaction/Index', [
            'transactions' => $transactions,
            'type' => $type,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function create(Request $request)
    {
        $type = $request->query('type', 'inbound'); 

        // 1. LOGIC FIX: Generate Nomor Transaksi 'TRX-YYYYMMDD-XXXX'
        $today = date('Ymd');
        $prefix = 'TRX-' . $today . '-'; // Format Prefix seragam
        
        // Cari nomor terakhir hari ini yang depannya TRX-YYYYMMDD-
        $lastTrx = Transaction::where('trx_number', 'like', $prefix . '%')
            ->orderByRaw("CAST(SUBSTRING(trx_number FROM " . (strlen($prefix) + 1) . ") AS INTEGER) DESC")
            ->first();

        $nextNumber = 1;
        if ($lastTrx) {
            // Ambil 4 digit terakhir
            $lastNumber = intval(substr($lastTrx->trx_number, -4));
            $nextNumber = $lastNumber + 1;
        }

        // Hasil: TRX-20260206-0001
        $newTrxNumber = $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Transaction/Create', [
            'type' => $type,
            'newTrxNumber' => $newTrxNumber,
            'warehouses' => Warehouse::all(),
            'units' => Unit::orderBy('name')->pluck('short_name'), 
            'categories' => \App\Models\Category::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:inbound,outbound',
            'trx_number' => 'required|string|unique:transactions,trx_number',
            'trx_date' => 'required|date',
            'warehouse_id' => 'required|exists:warehouses,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            // 2. LOGIC FIX: Validasi Stok untuk OUTBOUND
            if ($request->type === 'outbound') {
                foreach ($request->items as $item) {
                    // Cek stok di GUDANG YANG DIPILIH
                    $currentStock = Stock::where('product_id', $item['product_id'])
                        ->where('warehouse_id', $request->warehouse_id)
                        ->value('quantity'); // Ambil nilai quantity langsung

                    $currentStock = $currentStock ?? 0; // Jika null, anggap 0

                    // Jika stok kurang, batalkan transaksi
                    if ($currentStock < $item['quantity']) {
                        // Ambil nama produk untuk pesan error yang jelas
                        $productName = Product::find($item['product_id'])->name;
                        
                        throw ValidationException::withMessages([
                            'items' => "Stok '$productName' di gudang ini tidak cukup. Sisa: $currentStock, Diminta: {$item['quantity']}"
                        ]);
                    }
                }
            }

            // 3. Simpan Header Transaksi
            $transaction = Transaction::create([
                'user_id' => auth()->id(),
                'warehouse_id' => $request->warehouse_id,
                'trx_number' => $request->trx_number,
                'trx_date' => $request->trx_date,
                'type' => $request->type,
                'notes' => $request->notes ?? '-',
                'status' => 'completed', 
            ]);

            // 4. Loop Items & Update Stock
            foreach ($request->items as $item) {
                
                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);

                if ($request->type === 'inbound') {
                    // Inbound: Tambah Stok
                    $stock = Stock::firstOrCreate(
                        ['product_id' => $item['product_id'], 'warehouse_id' => $request->warehouse_id],
                        ['quantity' => 0]
                    );
                    $stock->increment('quantity', $item['quantity']);
                } else {
                    // Outbound: Kurangi Stok (Sudah divalidasi di atas, jadi aman)
                    Stock::where('product_id', $item['product_id'])
                        ->where('warehouse_id', $request->warehouse_id)
                        ->decrement('quantity', $item['quantity']);
                }
            }

            DB::commit();

            return redirect()->route('transactions.index', ['type' => $request->type])
                             ->with('success', 'Transaksi berhasil disimpan.');

        } catch (\Exception $e) {
            DB::rollBack();
            // Lempar kembali error validasi agar muncul di form frontend
            if ($e instanceof ValidationException) {
                throw $e;
            }
            return back()->withErrors(['error' => 'Gagal: ' . $e->getMessage()]);
        }
    }
}