<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Product;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;

class WmsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Reset Cache Permission
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Buat Permission (Gunakan firstOrCreate agar tidak error duplikat)
        $permissions = [
            'view_dashboard',
            // Produk
            'view_products', 'create_products', 'edit_products', 'delete_products',
            // Transaksi
            'view_inbound', 'create_inbound',
            'view_outbound', 'create_outbound',
            'view_transfers', 'create_transfers', 'approve_transfers',
            // Master Data
            'manage_warehouses', 'manage_users', 'manage_roles', 'manage_categories', 'view_settings'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]); // <-- INI YANG DIUBAH
        }

        // 3. Buat Roles (Gunakan firstOrCreate)
        // UBAH: Nama Role harus Title Case sesuai middleware di web.php ('Super Admin')
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        // Sync permission memastikan permission sesuai list, tidak double
        $roleSuperAdmin->syncPermissions(Permission::all());

        // UBAH: admin -> Supervisor (sesuai web.php)
        $roleAdmin = Role::firstOrCreate(['name' => 'Supervisor']);
        $roleAdmin->syncPermissions([
            'view_dashboard',
            'view_products', 'create_products', 'edit_products',
            'view_inbound', 'create_inbound',
            'view_outbound', 'create_outbound',
            'view_transfers', 'create_transfers', 'approve_transfers',
            'manage_warehouses', 'manage_categories', 'view_settings'
        ]);

        // UBAH: staff -> Staff
        $roleUser = Role::firstOrCreate(['name' => 'Staff']);
        $roleUser->syncPermissions([
            'view_dashboard',
            'view_products',
            'view_inbound', 'create_inbound',
            'view_outbound', 'create_outbound',
            'view_transfers', 'create_transfers'
        ]);

        // 4. Buat Gudang Utama (firstOrCreate berdasarkan Code)
        $warehouse = Warehouse::firstOrCreate(
            ['code' => 'WH-JKT-001'], // Cek berdasarkan kode ini
            [
                'name' => 'Gudang Pusat Jakarta',
                'address' => 'Jl. Kawasan Industri No. 1, Cikarang',
                'city' => 'Bekasi',
                'is_active' => true,
            ]
        );

        // 5. Buat User Superadmin
        $superadmin = User::firstOrCreate(
            ['email' => 'superadmin@wms.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
            ]
        );
        $superadmin->assignRole('Super Admin');

        // 6. Buat Admin Gudang
        $adminGudang = User::firstOrCreate(
            ['email' => 'admin@wms.com'],
            [
                'name' => 'Budi Kepala Gudang',
                'password' => Hash::make('password'),
            ]
        );
        $adminGudang->assignRole('Supervisor');

        // 7. Dummy Product
        Product::firstOrCreate(
            ['sku' => 'LAPTOP-001'],
            [
                'name' => 'Laptop ASUS ROG',
                'description' => 'Laptop Gaming High End',
                'category' => 'Electronics',
                'min_stock_alert' => 5,
            ]
        );

        Product::firstOrCreate(
            ['sku' => 'MOUSE-LOGI'],
            [
                'barcode' => '888555111222',
                'name' => 'Mouse Logitech Wireless',
                'category' => 'Accessories',
            ]
        );
    }
}