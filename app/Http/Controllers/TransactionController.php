<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Warehouse;
use App\Models\Unit; 
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

        // --- SECURITY CHECK (CEGAH AKSES URL LANGSUNG) ---
        // Jika user memaksa ganti URL ?type=outbound padahal tidak punya izin, kita tolak.
        if ($type === 'inbound') {
            if (!auth()->user()->can('view_inbound')) {
                abort(403, 'ANDA TIDAK MEMILIKI AKSES KE HALAMAN INBOUND.');
            }
        } elseif ($type === 'outbound') {
            if (!auth()->user()->can('view_outbound')) {
                abort(403, 'ANDA TIDAK MEMILIKI AKSES KE HALAMAN OUTBOUND.');
            }
        }
        // ------------------------------------------------

        $transactions = Transaction::with(['user', 'warehouse'])
            ->with(['details.product']) 
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

        // --- SECURITY CHECK (CEGAH AKSES FORM) ---
        if ($type === 'inbound') {
            if (!auth()->user()->can('create_inbound')) {
                abort(403, 'ANDA TIDAK BERHAK MEMBUAT TRANSAKSI INBOUND.');
            }
        } elseif ($type === 'outbound') {
            if (!auth()->user()->can('create_outbound')) {
                abort(403, 'ANDA TIDAK BERHAK MEMBUAT TRANSAKSI OUTBOUND.');
            }
        }
        // -----------------------------------------

        // Logic Generate Nomor Transaksi 'TRX-YYYYMMDD-XXXX'
        $today = date('Ymd');
        $prefix = 'TRX-' . $today . '-'; 
        
        $lastTrx = Transaction::where('trx_number', 'like', $prefix . '%')
            ->orderByRaw("CAST(SUBSTRING(trx_number FROM " . (strlen($prefix) + 1) . ") AS INTEGER) DESC")
            ->first();

        $nextNumber = 1;
        if ($lastTrx) {
            $lastNumber = intval(substr($lastTrx->trx_number, -4));
            $nextNumber = $lastNumber + 1;
        }

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
        // Validasi Input
        $request->validate([
            'type' => 'required|in:inbound,outbound',
            'trx_number' => 'required|string|unique:transactions,trx_number',
            'trx_date' => 'required|date',
            'warehouse_id' => 'required|exists:warehouses,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        // --- SECURITY CHECK (BACKEND VALIDATION) ---
        // Mencegah manipulasi request via Inspect Element / Postman
        if ($request->type === 'inbound' && !auth()->user()->can('create_inbound')) {
            abort(403, 'TINDAKAN DITOLAK: TIDAK ADA IZIN CREATE INBOUND');
        }
        if ($request->type === 'outbound' && !auth()->user()->can('create_outbound')) {
            abort(403, 'TINDAKAN DITOLAK: TIDAK ADA IZIN CREATE OUTBOUND');
        }
        // -------------------------------------------

        try {
            DB::beginTransaction();

            // Validasi Stok untuk OUTBOUND
            if ($request->type === 'outbound') {
                foreach ($request->items as $item) {
                    $currentStock = Stock::where('product_id', $item['product_id'])
                        ->where('warehouse_id', $request->warehouse_id)
                        ->value('quantity'); 

                    $currentStock = $currentStock ?? 0;

                    if ($currentStock < $item['quantity']) {
                        $productName = Product::find($item['product_id'])->name;
                        
                        throw ValidationException::withMessages([
                            'items' => "Stok '$productName' di gudang ini tidak cukup. Sisa: $currentStock, Diminta: {$item['quantity']}"
                        ]);
                    }
                }
            }

            // Simpan Header Transaksi
            $transaction = Transaction::create([
                'user_id' => auth()->id(),
                'warehouse_id' => $request->warehouse_id,
                'trx_number' => $request->trx_number,
                'trx_date' => $request->trx_date,
                'type' => $request->type,
                'notes' => $request->notes ?? '-',
                'status' => 'completed', 
            ]);

            // Loop Items & Update Stock
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
                    // Outbound: Kurangi Stok
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
            
            if ($e instanceof ValidationException) {
                throw $e;
            }
            return back()->withErrors(['error' => 'Gagal: ' . $e->getMessage()]);
        }
    }
}