<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('search');

        $categories = Category::with('parent') // Load nama parent
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('code', 'ilike', "%{$query}%");
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        // Ambil semua kategori untuk dropdown "Parent Category" (kecuali dirinya sendiri nanti di filter frontend jika perlu)
        $allCategories = Category::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Settings/Category', [
            'categories' => $categories,
            'allCategories' => $allCategories, // Untuk dropdown parent
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:categories,code', // Kode harus unik
            'color' => 'required|string|max:20',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        Category::create([
            'name' => $request->name,
            'code' => strtoupper($request->code), // Paksa huruf besar
            'color' => $request->color,
            'parent_id' => $request->parent_id,
        ]);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:categories,code,' . $category->id, // Ignore kode sendiri saat update
            'color' => 'required|string|max:20',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        // Cegah kategori menjadi parent bagi dirinya sendiri
        if ($request->parent_id == $category->id) {
            return back()->withErrors(['parent_id' => 'Kategori tidak bisa menjadi induk dirinya sendiri.']);
        }

        $category->update([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'color' => $request->color,
            'parent_id' => $request->parent_id,
        ]);

        return redirect()->back()->with('success', 'Kategori diperbarui.');
    }

    public function destroy(Category $category)
    {
        // Opsional: Cek apakah kategori dipakai di produk?
        // Jika ya, sebaiknya block delete atau set null.
        // Disini kita hapus saja (produk yang pakai kategori ini akan jadi null/error tergantung relasi)
        
        $category->delete();
        return redirect()->back()->with('success', 'Kategori dihapus.');
    }
}