<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. DASHBOARD
        Permission::create(['name' => 'view_dashboard']);

        // 2. INVENTORY (Data Barang)
        Permission::create(['name' => 'view_products']);
        Permission::create(['name' => 'create_products']);
        Permission::create(['name' => 'edit_products']);
        Permission::create(['name' => 'delete_products']);

        // 3. TRANSFER STOK
        Permission::create(['name' => 'view_transfers']);
        Permission::create(['name' => 'create_transfers']);
        Permission::create(['name' => 'approve_transfers']); // Khusus SPV/Manager

        // 4. TRANSAKSI (Inbound/Outbound)
        Permission::create(['name' => 'view_transactions']);
        Permission::create(['name' => 'create_transactions']);

        // 5. SETTINGS & USER MANAGEMENT
        Permission::create(['name' => 'view_settings']);
        Permission::create(['name' => 'manage_users']); // Create/Edit/Delete User
        Permission::create(['name' => 'manage_roles']); // Menu baru untuk atur role

        // --- CONTOH MEMBUAT ROLE DEFAULT (Bisa diubah via UI nanti) ---
        
        // Role: Super Admin (Dapat Semuanya)
        $roleAdmin = Role::create(['name' => 'Super Admin']);
        $roleAdmin->givePermissionTo(Permission::all());

        // Role: Staff Gudang (Hanya Operasional)
        $roleStaff = Role::create(['name' => 'Staff Gudang']);
        $roleStaff->givePermissionTo([
            'view_dashboard', 
            'view_products', 'create_products', // Staff boleh create barang jika tidak ada
            'view_transfers', 'create_transfers',
            'view_transactions', 'create_transactions'
        ]);

        // Role: Supervisor (Bisa Approve & Settings)
        $roleSpv = Role::create(['name' => 'Supervisor']);
        $roleSpv->givePermissionTo([
            'view_dashboard', 
            'view_products', 'edit_products',
            'view_transfers', 'create_transfers', 'approve_transfers',
            'view_transactions', 
            'view_settings' // Tapi tidak manage user
        ]);
    }
}