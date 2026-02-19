<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('search');

        $warehouses = Warehouse::query()
            ->with('locations')
            ->when($query, function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                  ->orWhere('code', 'ilike', "%{$query}%")
                  ->orWhere('city', 'ilike', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Ambil data Unit juga karena props 'units' dibutuhkan di Warehouse.jsx
        $units = \App\Models\Unit::orderBy('name')->get(); 

        return Inertia::render('Settings/Warehouse', [ // Pastikan path folder React benar (Settings atau Warehouse?)
            'warehouses' => $warehouses,
            'units' => $units, // <--- Kirim units
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:warehouses,code|max:20',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
        ]);

        Warehouse::create($validated + ['is_active' => true]);

        return redirect()->back()->with('success', 'Gudang berhasil ditambahkan.');
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:warehouses,code,' . $warehouse->id,
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'is_active' => 'boolean'
        ]);

        $warehouse->update($validated);

        return redirect()->back()->with('success', 'Data gudang diperbarui.');
    }

    public function destroy(Warehouse $warehouse)
    {
        // Opsional: Cek relasi sebelum delete
        $warehouse->delete();
        return redirect()->back()->with('success', 'Gudang dihapus.');
    }
}