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
        // 1. Data Ringkasan (Stats Cards)
        $totalProducts = Product::count();
        $totalStock = Product::withSum('stocks', 'quantity')->get()->sum('stocks_sum_quantity');
        $lowStockCount = Product::whereHas('stocks', function($q) {
            // Logic kasar: produk yg total stoknya <= min_stock_alert
            // (Idealnya query ini lebih kompleks, tapi ini cukup untuk dashboard cepat)
        })->count(); // Atau kita hitung di frontend dari data produk

        // 2. 5 Transaksi Inbound Terbaru
        $recentInbound = Transaction::with(['user', 'details.product'])
            ->where('type', 'inbound')
            ->latest()
            ->take(5)
            ->get();

        // 3. 5 Transaksi Outbound Terbaru
        $recentOutbound = Transaction::with(['user', 'details.product'])
            ->where('type', 'outbound')
            ->latest()
            ->take(5)
            ->get();

        // 4. Daftar User (Limit 5 untuk widget)
        $users = User::latest()->take(5)->get();

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