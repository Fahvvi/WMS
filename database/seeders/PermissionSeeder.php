<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        // 1. Reset Cache Permission agar tidak error
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Daftar Permission Standar (Format: verb_noun)
        // Ini disesuaikan agar MATCH dengan kode Frontend React Anda
        $permissions = [
            // --- DASHBOARD ---
            'view_dashboard',
            
            // --- TRANSAKSI (INBOUND / OUTBOUND) ---
            'view_inbound', 'create_inbound',
            'view_outbound', 'create_outbound',
            'delete_transactions',
            
            // --- DATA PRODUK (MASTER DATA) ---
            'view_products', 'create_products', 'edit_products', 'delete_products',
            'import_products', // BARU: Izin upload Excel produk
            'export_products', // BARU: Izin download Excel produk
            
            // --- STOCK TRANSFER (PINDAH GUDANG) ---
            'view_transfers', 'create_transfers', 'approve_transfers',

            // --- STOCK OPNAME (AUDIT STOK) ---
            'view_stock_opname',   
            'create_stock_opname', 
            'export_stock_opname', // BARU: Download hasil opname
            
            // --- LAPORAN & RIWAYAT (HISTORY) ---
            // Kita pisahkan permission laporan agar Manager bisa akses tanpa harus jadi Admin
            'view_reports', 
            'export_stock_history', // BARU: Download kartu stok/riwayat
            
            // --- PENGATURAN (SETTINGS) ---
            'view_settings',
            'manage_users',      
            'manage_roles',      
            'manage_warehouses', 
            'manage_categories', 
        ];

        // Buat Permission ke Database
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // --- DEFINISI ROLE & HAK AKSES ---

        // A. SUPER ADMIN (Dewa)
        // Bisa akses segalanya
        $roleAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $roleAdmin->syncPermissions(Permission::all());

        // B. SUPERVISOR (Kepala Gudang)
        // Bisa approve, lihat settings terbatas, tapi tidak bisa edit user/role
        $roleSpv = Role::firstOrCreate(['name' => 'Supervisor']);
        $roleSpv->syncPermissions([
            'view_dashboard',
            'view_inbound', 'create_inbound',
            'view_outbound', 'create_outbound',
            'view_products', 'edit_products',
            'view_transfers', 'create_transfers', 'approve_transfers', // Bisa approve
            'view_stock_opname',
            'view_settings',
            'manage_warehouses', 
            'manage_categories'
        ]);

        // C. STAFF (Operasional)
        // Hanya bisa input transaksi dan lihat stok
        $roleStaff = Role::firstOrCreate(['name' => 'Staff']);
        $roleStaff->syncPermissions([
            'view_dashboard',
            'view_inbound', 'create_inbound',   // Boleh Inbound
            'view_outbound', 'create_outbound', // Boleh Outbound
            'view_products', 'create_products', // Boleh create barang baru jika belum ada
            'view_transfers', 'create_transfers' // Boleh request transfer (tapi tidak approve)
        ]);
    }
}