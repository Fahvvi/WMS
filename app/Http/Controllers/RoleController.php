<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;
use Illuminate\Validation\Rule;


class RoleController extends Controller
{
    public function index()
    {
        // Ambil semua Role beserta permission-nya
        $roles = Role::with('permissions')->orderBy('id')->get();

        // Ambil semua Permission untuk pilihan di form
        $allPermissions = Permission::all();

        // LOGIC GROUPING: Kelompokkan permission berdasarkan modulnya
        // Contoh: 'view_products' -> masuk grup 'Products'
        $groupedPermissions = $allPermissions->groupBy(function ($perm) {
            $parts = explode('_', $perm->name); // pisah 'view_products'
            return count($parts) > 1 ? \Str::title($parts[1]) : 'Other'; // ambil 'Products'
        });

        return Inertia::render('Settings/Role/Index', [
            'roles' => $roles,
            'groupedPermissions' => $groupedPermissions, // Kirim data yang sudah digrup
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:roles,name',
            'permissions' => 'array'
        ]);

        $role = Role::create(['name' => $request->name]);
        
        // Sync permission yang dicentang
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return back()->with('success', 'Role berhasil dibuat.');
    }

    public function update(Request $request, Role $role)
    {
        // Cegah edit Super Admin agar tidak error sistem
        if ($role->name === 'Super Admin') {
            return back()->with('error', 'Role Super Admin tidak bisa diubah!');
        }

        $request->validate([
            'name' => ['required', Rule::unique('roles', 'name')->ignore($role->id)],
            'permissions' => 'array'
        ]);

        $role->update(['name' => $request->name]);
        
        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroy(Role $role)
    {
        if ($role->name === 'Super Admin') {
            return back()->with('error', 'Role Super Admin tidak bisa dihapus!');
        }
        
        $role->delete();
        return back()->with('success', 'Role berhasil dihapus.');
    }
}