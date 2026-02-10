<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('roles'); // Load relasi roles

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('nip', 'like', "%{$request->search}%");
        }

        // Ambil semua nama role untuk dropdown di Frontend
        $availableRoles = Role::pluck('name'); 

        return Inertia::render('Settings/User', [
            'users' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search']),
            'available_roles' => $availableRoles, // Kirim ke props
        ]);
    }

   public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nip' => 'nullable|string|max:20|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|exists:roles,name', // Validasi role harus ada di tabel roles
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'nip' => $request->nip,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role, // Simpan juga di kolom legacy untuk jaga-jaga
        ]);

        // SPATIE: Assign Role
        $user->assignRole($request->role);

        return back()->with('success', 'User berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nip' => 'nullable|string|max:20|unique:users,nip,' . $user->id,
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|exists:roles,name',
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $data = [
            'name' => $request->name,
            'nip' => $request->nip,
            'email' => $request->email,
            'role' => $request->role, // Legacy update
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        // SPATIE: Sync Role (Hapus role lama, pasang role baru)
        $user->syncRoles([$request->role]);

        return back()->with('success', 'Data user diperbarui.');
    }

    public function destroy(User $user)
    {
        if ($user->hasRole('Super Admin')) {
            return back()->with('error', 'Super Admin tidak boleh dihapus!');
        }
        $user->delete();
        return back()->with('success', 'User berhasil dihapus.');
    }
}