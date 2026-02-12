<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        // 1. Security Check (View)
        // Pastikan user punya izin 'manage_categories' atau 'view_settings'
        if (!auth()->user()->can('manage_categories')) { 
            abort(403, 'ANDA TIDAK MEMILIKI AKSES KE HALAMAN KATEGORI.');
        }

        $query = $request->input('search');

        $categories = Category::query()
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Settings/Category', [ // Pastikan nama file Page sesuai
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    // METHOD INI WAJIB ADA JIKA PAKAI RESOURCE ROUTE
    public function edit(Category $category)
    {
        // 2. Security Check (Edit)
        if (!auth()->user()->can('manage_categories')) {
            abort(403, 'ANDA TIDAK MEMILIKI AKSES EDIT KATEGORI.');
        }

        // Karena kategori biasanya popup modal di satu halaman (Settings/Category),
        // Kita mungkin tidak butuh halaman Edit khusus.
        // TAPI agar tidak error 500 saat ditembak URL, kita redirect saja atau return json.
        
        return redirect()->route('categories.index')
            ->with('error', 'Silakan edit melalui tombol di halaman list.');
    }

    public function store(Request $request)
    {
        if (!auth()->user()->can('manage_categories')) abort(403);

        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
        ]);

        Category::create([
            'name' => $request->name
        ]);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category)
    {
        if (!auth()->user()->can('manage_categories')) abort(403);

        $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories')->ignore($category->id)],
        ]);

        $category->update([
            'name' => $request->name
        ]);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category)
    {
        if (!auth()->user()->can('manage_categories')) abort(403);

        // Cek apakah kategori dipakai produk (Opsional, untuk keamanan data)
        if ($category->products()->exists()) {
            return back()->with('error', 'Gagal! Kategori ini sedang digunakan oleh Produk.');
        }

        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus.');
    }
}