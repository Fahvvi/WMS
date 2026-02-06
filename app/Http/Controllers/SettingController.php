<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Unit;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse; // Jangan lupa import ini
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class SettingController extends Controller
{
    // --- HALAMAN 1: GUDANG (Pindahan dari WarehouseController lama) ---
    public function warehouseIndex(Request $request)
    {
        // Copy logic dari WarehouseController lama, tapi render ke 'Settings/Warehouse'
        $query = $request->input('search');
        $warehouses = Warehouse::query()
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('code', 'ilike', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)->withQueryString();

        return Inertia::render('Settings/Warehouse', [
            'warehouses' => $warehouses,
            'filters' => $request->only(['search']),
        ]);
    }

    // --- HALAMAN 2: ATTRIBUTES (Unit & Category) ---
    public function attributeIndex()
    {
        return Inertia::render('Settings/Attribute', [
            'categories' => Category::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->get(),
        ]);
    }

    // --- HALAMAN 3: USERS ---
    public function userIndex()
    {
        // Tampilkan semua user kecuali password
        return Inertia::render('Settings/User', [
            'users' => User::select('id', 'name', 'email', 'created_at')->orderBy('name')->get()
        ]);
    }

    // === CRUD SIMPEL UNTUK CATEGORY & UNIT ===
    
    public function storeCategory(Request $request) {
        $request->validate(['name' => 'required|unique:categories,name']);
        Category::create($request->only('name'));
        return back()->with('success', 'Kategori ditambahkan');
    }

    public function destroyCategory(Category $category) {
        $category->delete();
        return back()->with('success', 'Kategori dihapus');
    }

    public function storeUnit(Request $request) {
        $request->validate(['name' => 'required|unique:units,name']);
        Unit::create($request->all());
        return back()->with('success', 'Satuan Unit ditambahkan');
    }

    public function destroyUnit(Unit $unit) {
        $unit->delete();
        return back()->with('success', 'Satuan Unit dihapus');
    }
    
    public function materialCreate(Request $request)
    {
        $selectedCategory = $request->input('category');
        $search = $request->input('search');

        // Ambil Produk dengan filter Kategori & Search
        $materials = Product::query()
            ->when($selectedCategory, function($q) use ($selectedCategory) {
                $q->where('category', $selectedCategory);
            })
            ->when($search, function($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('sku', 'ilike', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15) // Lebih banyak per halaman biar padat
            ->withQueryString();

        return Inertia::render('Settings/Material', [
            'materials' => $materials,
            'categories' => Category::orderBy('name')->get(), // Ambil objek lengkap untuk Sidebar
            'units' => Unit::orderBy('name')->pluck('name'),
            'currentCategory' => $selectedCategory,
            'filters' => $request->only(['search', 'category'])
        ]);
    }
}



