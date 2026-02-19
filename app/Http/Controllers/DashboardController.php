<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Cek apakah user adalah admin (sesuaikan dengan logic role Anda, misal pakai Spatie atau kolom role)
        // Asumsi: menggunakan Spatie $user->hasRole('Super Admin') atau kolom $user->role === 'Super Admin'
        $isAdmin = $user->role === 'Super Admin' || ($user->roles && $user->roles->contains('name', 'Super Admin'));

        // 1. Data Ringkasan (Stats Cards)
        $totalProducts = Product::count();
        $totalStock = Product::withSum('stocks', 'quantity')->get()->sum('stocks_sum_quantity');

        // 2. Transaksi Inbound 
        // JIKA ADMIN: Ambil lebih banyak (misal 50 atau paginate) untuk tabel besar di atas
        // JIKA STAFF: Ambil 5 saja untuk widget bawah
        $inboundQuery = Transaction::with(['user', 'details.product'])
            ->where('type', 'inbound')
            ->latest();

        if ($isAdmin) {
            $recentInbound = $inboundQuery->take(50)->get(); // Ambil 50 untuk Admin
        } else {
            $recentInbound = $inboundQuery->take(5)->get(); // Ambil 5 untuk Staff
        }

        // 3. 5 Transaksi Outbound Terbaru (Tetap 5 untuk widget bawah)
        $recentOutbound = Transaction::with(['user', 'details.product'])
            ->where('type', 'outbound')
            ->latest()
            ->take(5)
            ->get();

        // 4. Daftar User untuk Widget Team
        // Urutkan berdasarkan yang terakhir login
        $users = User::orderByDesc('last_login_at')->take(5)->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_products' => $totalProducts,
                'total_stock' => $totalStock,
            ],
            'recent_inbound' => $recentInbound,
            'recent_outbound' => $recentOutbound,
            'users' => $users,
        ]);
    }
}