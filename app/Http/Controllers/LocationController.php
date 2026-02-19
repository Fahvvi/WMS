<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LocationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'code' => 'required|string|max:50|unique:locations,code',
            'type' => 'required|in:storage,receiving,shipping,quarantine',
        ]);

        Location::create($validated);

        return redirect()->back()->with('success', 'Rak baru berhasil ditambahkan.');
    }

    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:locations,code,' . $location->id,
            'type' => 'required|in:storage,receiving,shipping,quarantine',
        ]);

        $location->update($validated);

        return redirect()->back()->with('success', 'Data rak diperbarui.');
    }

    public function destroy(Location $location)
    {
        // Cek apakah ada stok di rak ini sebelum menghapus
        $hasStock = Stock::where('location_id', $location->id)
            ->where('quantity', '>', 0)
            ->exists();

        if ($hasStock) {
            return redirect()->back()->withErrors(['error' => 'Gagal! Rak ini masih memiliki stok barang. Kosongkan terlebih dahulu.']);
        }

        $location->delete();

        return redirect()->back()->with('success', 'Rak berhasil dihapus.');
    }
}