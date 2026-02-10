<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class, // Panggil ini DULUAN
            WmsSeeder::class,        // Baru data user/barang
        ]);
    }
}