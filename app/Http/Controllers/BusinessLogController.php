<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
use App\Exports\BusinessLogExport;
use Maatwebsite\Excel\Facades\Excel;

class BusinessLogController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->user()->can('view_business_log')) {
            abort(403, 'Anda tidak memiliki akses ke Business Log.');
        }

        // Ambil input filter dari request
        $search = $request->input('search');
        $menu = $request->input('menu');
        $date = $request->input('date');

        // Query dasar
        $query = Activity::with('causer')->latest();

        // 1. Filter by Nama User
        if ($search) {
            $query->whereHas('causer', function ($q) use ($search) {
                $q->where('name', 'ilike', '%' . $search . '%'); // Gunakan 'like' jika pakai MySQL
            });
        }

        // 2. Filter by Menu (Subject Type)
        if ($menu) {
            // Karena subject_type di database adalah full namespace (ex: App\Models\Product)
            // kita gunakan LIKE agar cocok dengan kata kuncinya.
            $query->where('subject_type', 'like', '%' . $menu . '%');
        }

        // 3. Filter by Tanggal (Mencocokkan YYYY-MM-DD dengan created_at)
        if ($date) {
            $query->whereDate('created_at', $date);
        }

        $logs = $query->paginate(15)->withQueryString(); // withQueryString agar pagination ingat filternya

        // Daftar Menu yang tersedia untuk dropdown (Bisa disesuaikan dengan model yang Anda lacak)
        $availableMenus = [
            'Product' => 'Master Produk',
            'User' => 'Manajemen User',
            'StockOpname' => 'Stock Opname',
            'Transaction' => 'Transaksi',
            'StockTransfer' => 'Transfer Stok',
            'Warehouse' => 'Gudang'
        ];

        return Inertia::render('Settings/BusinessLog', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'menu', 'date']), // Kirim kembali filter ke frontend
            'availableMenus' => $availableMenus
        ]);
    }

    public function export(Request $request)
    {
        if (!auth()->user()->can('view_business_log')) {
            abort(403, 'Anda tidak memiliki akses.');
        }

        $search = $request->input('search');
        $menu = $request->input('menu');
        $date = $request->input('date');

        // Buat nama file yang dinamis
        $filename = 'Business_Log_Export_' . date('Y-m-d_H-i') . '.xlsx';

        // Panggil class Export yang sudah kita buat
        return Excel::download(new BusinessLogExport($search, $menu, $date), $filename);
    }
}