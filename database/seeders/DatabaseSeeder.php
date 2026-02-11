<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
{
    $this->call([
        PermissionSeeder::class, // <--- PENTING: Harus paling atas
        WmsSeeder::class,        // Seeder user/dummy data
    ]);
}
}