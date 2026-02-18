<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Unit;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class SettingController extends Controller
{
    /**
     * Halaman Utama Settings
     * Izin: view_settings
     */
    public function index()
    {
        // Security Check: Minimal punya izin 'view_settings'
        if (!auth()->user()->can('view_settings')) {
            abort(403, 'ANDA TIDAK MEMILIKI AKSES KE PENGATURAN.');
        }

        // RENDER HALAMAN OVERVIEW (JANGAN REDIRECT KE GUDANG)
        return Inertia::render('Settings/Index'); 
    }

    /**
     * Halaman Gudang (Warehouse)
     * Izin: manage_warehouses (HANYA SUPER ADMIN)
     */
    public function warehouseIndex(Request $request)
    {
        // Security Check
        if (!auth()->user()->can('manage_warehouses')) {
            abort(403, 'AKSES DITOLAK: ANDA TIDAK BOLEH MENGELOLA GUDANG.');
        }

        // 1. Data Gudang (Pagination)
        $query = $request->input('search');
        $warehouses = Warehouse::query()
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('code', 'ilike', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)->withQueryString();

        // 2. Data Unit (Semua) - KEMBALIKAN DATA INI
        $units = Unit::orderBy('name')->get();

        return Inertia::render('Settings/Warehouse', [
            'warehouses' => $warehouses,
            'units' => $units, 
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Halaman Material / Produk (Settings Mode)
     * Izin: manage_categories (Asumsi Staff boleh atur ini juga)
     * ATAU ganti ke 'manage_materials' jika ingin dikunci khusus
     */
    public function materialCreate(Request $request)
    {
        // SECURITY CHECK
        // Kita samakan dengan manage_categories agar Staff bisa akses (sesuai request)
        // Jika ingin dikunci, ganti jadi 'manage_products' atau 'super_admin'
        if (!auth()->user()->can('manage_categories')) {
            abort(403, 'AKSES DITOLAK: TIDAK ADA IZIN MATERIAL.');
        }

        $selectedCategory = $request->input('category');
        $search = $request->input('search');

        $materials = Product::query()
            ->when($selectedCategory, function($q) use ($selectedCategory) {
                // PERBAIKAN: Gunakan ILIKE dan tambahkan '%' di akhir string
                // Ini akan menemukan "Elektronik" DAN "Elektronik -> Battery"
                $q->where('category', 'ilike', $selectedCategory . '%'); 
            })
            ->when($search, function($q) use ($search) {
                $q->where(function($subQ) use ($search) {
                    $subQ->where('name', 'ilike', "%{$search}%")
                         ->orWhere('sku', 'ilike', "%{$search}%")
                         ->orWhere('barcode', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Settings/Material', [
            'materials' => $materials,
            'categories' => Category::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->pluck('short_name'),
            'currentCategory' => $selectedCategory,
            'filters' => $request->only(['search', 'category'])
        ]);
    }

    /**
     * Simpan Unit Baru
     * Izin: manage_categories (Disamakan agar Staff bisa buat Unit)
     */
    public function unitStore(Request $request) 
    {
        // SECURITY CHECK
        if (!auth()->user()->can('manage_categories')) {
            abort(403);
        }

        $request->validate(['name' => 'required|unique:units,name']);
        
        Unit::create($request->all());
        
        return back()->with('success', 'Satuan Unit ditambahkan');
    }

    /**
     * Hapus Unit
     * Izin: manage_categories
     */
    public function destroyUnit(Unit $unit) 
    {
        // SECURITY CHECK
        if (!auth()->user()->can('manage_categories')) {
            abort(403);
        }

        $unit->delete();
        
        return back()->with('success', 'Satuan Unit dihapus');
    }
}