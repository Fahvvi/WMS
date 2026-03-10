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
        
        // Cek apakah user adalah admin
        $isAdmin = $user->role === 'Super Admin' || ($user->roles && $user->roles->contains('name', 'Super Admin'));

        // 1. Data Ringkasan (Stats Cards)
        $totalProducts = Product::count();
        $totalStock = Product::withSum('stocks', 'quantity')->get()->sum('stocks_sum_quantity');
        
        // KITA TAMBAHKAN PERHITUNGAN TOTAL USER DI SINI (Hanya menghitung angkanya, bukan mengambil datanya)
        $totalUsersCount = User::count();

        // 2. Transaksi Inbound 
        $inboundQuery = Transaction::with(['user', 'details.product'])
            ->where('type', 'inbound')
            ->latest();

        if ($isAdmin) {
            $recentInbound = $inboundQuery->take(50)->get(); 
        } else {
            $recentInbound = $inboundQuery->take(5)->get();
        }

        // 3. 5 Transaksi Outbound Terbaru 
        $recentOutbound = Transaction::with(['user', 'details.product'])
            ->where('type', 'outbound')
            ->latest()
            ->take(5)
            ->get();

        // 4. Daftar User untuk Widget Team (Tetap pertahankan ambil 5 yang paling baru login agar ringan)
        $users = User::orderByDesc('last_login_at')->take(5)->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_products' => $totalProducts,
                'total_stock' => $totalStock,
                // LEMPAR DATA ANGKA TOTAL USER KE FRONTEND
                'total_users' => $totalUsersCount,
            ],
            'recent_inbound' => $recentInbound,
            'recent_outbound' => $recentOutbound,
            'users' => $users,
        ]);
    }
}