<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    // Halaman List Transaksi (Inbound/Outbound)
    public function index(Request $request)
    {
        $type = $request->query('type', 'inbound'); // Default inbound

        $transactions = Transaction::with(['user', 'warehouse'])
            ->where('type', $type)
            ->orderBy('trx_date', 'desc')
            ->paginate(10);

        return Inertia::render('Transaction/Index', [
            'transactions' => $transactions,
            'type' => $type
        ]);
    }

    // Halaman Form Tambah Transaksi
    public function create(Request $request)
    {
        $type = $request->query('type', 'inbound');
        
        return Inertia::render('Transaction/Create', [
            'type' => $type,
            // Kirim data pendukung untuk dropdown
            'warehouses' => Warehouse::where('is_active', true)->get(),
            'products' => Product::select('id', 'name', 'sku', 'unit')->get(),
            // Generate No Transaksi Otomatis (TRX-IN-YYYYMMDD-XXXX)
            'newTrxNumber' => 'TRX-' . ($type == 'inbound' ? 'IN' : 'OUT') . '-' . date('Ymd') . '-' . strtoupper(Str::random(4)),
        ]);
    }

    // PROSES PENYIMPANAN (LOGIC UTAMA)
    public function store(Request $request)
    {
        // 1. Validasi Input
        $request->validate([
            'type' => 'required|in:inbound,outbound',
            'warehouse_id' => 'required|exists:warehouses,id',
            'trx_date' => 'required|date',
            'trx_number' => 'required|unique:transactions,trx_number',
            'items' => 'required|array|min:1', // Wajib ada minimal 1 barang
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction(); // Mulai Transaksi Database

            // 2. Buat Header Transaksi
            $transaction = Transaction::create([
                'trx_number' => $request->trx_number,
                'type' => $request->type,
                'user_id' => Auth::id(), // User yang login (History tercatat disini)
                'warehouse_id' => $request->warehouse_id,
                'trx_date' => $request->trx_date,
                'status' => 'completed', // Langsung completed karena update stok real-time
                'notes' => $request->notes,
            ]);

            // 3. Loop Item Barang
            foreach ($request->items as $item) {
                // Simpan Detail
                TransactionDetail::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);

                // 4. Update Stok Real-time (Tabel stocks)
                // Cari apakah stok barang ini sudah ada di gudang tersebut?
                $stock = Stock::firstOrCreate(
                    [
                        'warehouse_id' => $request->warehouse_id,
                        'product_id' => $item['product_id']
                    ],
                    ['quantity' => 0] // Default 0 jika baru pertama kali masuk
                );

                // Tambah atau Kurang Stok
                if ($request->type === 'inbound') {
                    $stock->increment('quantity', $item['quantity']);
                } else {
                    // Cek stok cukup gak? (Khusus outbound)
                    if ($stock->quantity < $item['quantity']) {
                        throw new \Exception("Stok barang ID {$item['product_id']} tidak cukup!");
                    }
                    $stock->decrement('quantity', $item['quantity']);
                }
            }

            DB::commit(); // Simpan permanen jika semua sukses

            return redirect()->route('transactions.index', ['type' => $request->type])
                ->with('success', 'Transaksi berhasil disimpan!');

        } catch (\Exception $e) {
            DB::rollBack(); // Batalkan semua jika ada error
            return back()->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }
}