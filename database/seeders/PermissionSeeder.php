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

        // DAFTAR PERMISSION LENGKAP (Sesuai Frontend React)
        $permissions = [
            'view_dashboard',
            
            // Transaksi (DIPISAH agar Staff bisa diatur)
            'view_inbound', 'create_inbound',
            'view_outbound', 'create_outbound',
            
            // Inventory
            'view_products', 'create_products', 'edit_products', 'delete_products',
            'view_transfers', 'create_transfers', 'approve_transfers',
            'view_stock_opname', // Future proof
            
            // Settings
            'view_settings',
            'view_users', 'create_users', 'edit_users', 'delete_users',
            'view_roles', 'create_roles', 'edit_roles', 'delete_roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // --- ROLE DEFINITIONS ---

        // 1. Super Admin
        $roleAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $roleAdmin->syncPermissions(Permission::all());

        // 2. Supervisor
        $roleSpv = Role::firstOrCreate(['name' => 'Supervisor']);
        $roleSpv->syncPermissions([
            'view_dashboard',
            'view_inbound', 'create_inbound',
            'view_outbound', 'create_outbound',
            'view_products', 'edit_products',
            'view_transfers', 'create_transfers', 'approve_transfers',
            'view_stock_opname',
            'view_settings'
        ]);

        // 3. Staff
        $roleStaff = Role::firstOrCreate(['name' => 'Staff']);
        $roleStaff->syncPermissions([
            'view_dashboard',
            'view_inbound', 'create_inbound', // Staff Inbound
            'view_outbound', 'create_outbound', // Staff Outbound
            'view_products', 'create_products', // Bisa bikin produk baru
            'view_transfers', 'create_transfers', // Bisa request transfer
        ]);
    }
}