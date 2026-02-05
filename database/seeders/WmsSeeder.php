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
            'dashboard_view',
            // Produk
            'product_view', 'product_create', 'product_edit', 'product_delete',
            // Transaksi
            'inbound_view', 'inbound_create',
            'outbound_view', 'outbound_create',
            // Master Data
            'warehouse_manage', 'user_manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]); // <-- INI YANG DIUBAH
        }

        // 3. Buat Roles (Gunakan firstOrCreate)
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'superadmin']);
        // Sync permission memastikan permission sesuai list, tidak double
        $roleSuperAdmin->syncPermissions(Permission::all());

        $roleAdmin = Role::firstOrCreate(['name' => 'admin']);
        $roleAdmin->syncPermissions([
            'dashboard_view',
            'product_view', 'product_create', 'product_edit',
            'inbound_view', 'inbound_create',
            'outbound_view', 'outbound_create',
        ]);

        $roleUser = Role::firstOrCreate(['name' => 'staff']);
        $roleUser->syncPermissions([
            'dashboard_view',
            'product_view',
            'inbound_view',
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
        $superadmin->assignRole('superadmin');

        // 6. Buat Admin Gudang
        $adminGudang = User::firstOrCreate(
            ['email' => 'admin@wms.com'],
            [
                'name' => 'Budi Kepala Gudang',
                'password' => Hash::make('password'),
            ]
        );
        $adminGudang->assignRole('admin');

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