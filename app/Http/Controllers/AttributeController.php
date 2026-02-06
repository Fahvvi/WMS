<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Unit; // Pakai Model yang SUDAH ADA
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttributeController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        // Ambil Data Unit yang SUDAH ADA
        $units = Unit::query()
            ->when($search, function($q) use ($search){
                $q->where('name', 'ilike', "%{$search}%");
            })
            ->orderBy('name')
            ->get();

        // Ambil Data Kategori (Yang baru kita upgrade strukturnya)
        $categories = Category::with('parent')
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('code', 'ilike', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        $allCategories = Category::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Settings/Attribute', [
            'units' => $units,
            'categories' => $categories,
            'allCategories' => $allCategories,
            'filters' => $request->only(['search']),
        ]);
    }

    // --- LOGIC CRUD UNIT (Baru, agar bisa diedit di Settings) ---
    public function storeUnit(Request $request)
    {
        // Validasi short_name (boleh null/kosong)
        $request->validate([
            'name' => 'required|string|max:50',
            'short_name' => 'nullable|string|max:10' // Tambahkan ini
        ]);
        
        Unit::create([
            'name' => $request->name,
            'short_name' => $request->short_name ?? substr($request->name, 0, 3) // Default 3 huruf awal jika kosong
        ]);
        
        return back()->with('success', 'Satuan berhasil ditambahkan.');
    }

    public function updateUnit(Request $request, Unit $unit)
    {
        $request->validate([
            'name' => 'required|string|max:50',
            'short_name' => 'nullable|string|max:10'
        ]);
        
        $unit->update([
            'name' => $request->name,
            'short_name' => $request->short_name
        ]);
        
        return back()->with('success', 'Satuan diperbarui.');
    }

    public function destroyUnit(Unit $unit)
    {
        $unit->delete();
        return back()->with('success', 'Satuan dihapus.');
    }

    // --- LOGIC CRUD CATEGORY (Sama seperti sebelumnya) ---
    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:categories,code',
            'color' => 'required|string|max:20',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        Category::create([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'color' => $request->color,
            'parent_id' => $request->parent_id,
        ]);
        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function updateCategory(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:categories,code,' . $category->id,
            'color' => 'required|string|max:20',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        if ($request->parent_id == $category->id) return back()->withErrors(['parent_id' => 'Error loop induk.']);

        $category->update([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'color' => $request->color,
            'parent_id' => $request->parent_id,
        ]);
        return back()->with('success', 'Kategori diperbarui.');
    }

    public function destroyCategory(Category $category)
    {
        $category->delete();
        return back()->with('success', 'Kategori dihapus.');
    }
}