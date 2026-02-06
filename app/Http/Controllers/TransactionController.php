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
        $type = $request->input('type', 'inbound');
        
        // --- GENERATE NOMOR TRANSAKSI BARU (TRX-YYYYMMDD00001) ---
        $prefix = 'TRX-' . date('Ymd'); // Contoh: TRX-20260206
        
        // Cari transaksi terakhir hari ini (apapun tipenya)
        $lastTrx = Transaction::where('trx_number', 'like', $prefix . '%')
            ->orderBy('id', 'desc')
            ->first();
        
        // Ambil 5 digit terakhir, ubah jadi integer, lalu tambah 1
        if ($lastTrx) {
            // Asumsi format TRX-2026020600001 (total 17 karakter, ambil 5 digit dari belakang)
            $lastSequence = intval(substr($lastTrx->trx_number, -5));
            $sequence = $lastSequence + 1;
        } else {
            $sequence = 1;
        }

        // Gabungkan kembali: TRX-20260206 + 00001
        $newTrxNumber = $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);

        return Inertia::render('Transaction/Create', [
            'type' => $type,
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'newTrxNumber' => $newTrxNumber,
            // Kirim daftar unit untuk dropdown (Type-to-Filter)
            'units' => Unit::orderBy('name')->pluck('name'), 
        ]);
    }

    public function store(Request $request)
    {
        // Validasi input
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
            // Mulai Database Transaction (Semua sukses atau semua gagal)
            DB::beginTransaction();

            // 1. Simpan Header Transaksi
            $transaction = Transaction::create([
                'user_id' => auth()->id(),
                'warehouse_id' => $request->warehouse_id,
                'trx_number' => $request->trx_number,
                'trx_date' => $request->trx_date,
                'type' => $request->type,
                'notes' => $request->notes ?? '-',
                'status' => 'completed', 
            ]);

            // 2. Loop Setiap Barang & Update Stok
            foreach ($request->items as $item) {
                
                // A. Simpan Detail Riwayat
                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);

                // B. UPDATE TABEL STOCK
                if ($request->type === 'inbound') {
                    // INBOUND: Tambah Stok
                    // Cari stok lama, kalau belum ada buat baru dengan qty 0
                    $stock = Stock::firstOrCreate(
                        [
                            'product_id' => $item['product_id'],
                            'warehouse_id' => $request->warehouse_id
                        ],
                        ['quantity' => 0]
                    );
                    
                    // Tambahkan jumlah baru
                    $stock->increment('quantity', $item['quantity']);

                } else {
                    // OUTBOUND: Kurangi Stok
                    $stock = Stock::where('product_id', $item['product_id'])
                        ->where('warehouse_id', $request->warehouse_id)
                        ->first();

                    if ($stock) {
                        $stock->decrement('quantity', $item['quantity']);
                    }
                }
            }

            // Simpan perubahan ke database
            DB::commit();

            return redirect()->route('transactions.index', ['type' => $request->type])
                             ->with('success', 'Transaksi berhasil disimpan & Stok terupdate.');

        } catch (\Exception $e) {
            // Batalkan semua perubahan jika ada error
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan transaksi: ' . $e->getMessage()]);
        }
    }
}