<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run()
    {
        // 1. Kategori Induk
        $raw = Category::create([
            'name' => 'Raw Material',
            'code' => 'RM',
            'color' => '#f59e0b', // Amber/Orange
        ]);

        $finished = Category::create([
            'name' => 'Finished Goods',
            'code' => 'FG',
            'color' => '#10b981', // Emerald/Green
        ]);
        
        $sparepart = Category::create([
            'name' => 'Spareparts',
            'code' => 'SP',
            'color' => '#3b82f6', // Blue
        ]);

        // 2. Sub Kategori (Contoh Hirarki)
        Category::create([
            'name' => 'Battery',
            'code' => 'BT',
            'color' => '#ef4444', // Red
            'parent_id' => $raw->id // Masuk ke grup Raw Material
        ]);

        Category::create([
            'name' => 'Motor',
            'code' => 'MT',
            'color' => '#8b5cf6', // Violet
            'parent_id' => $sparepart->id // Masuk ke grup Spareparts
        ]);
        
        Category::create([
            'name' => 'Packaging',
            'code' => 'PK',
            'color' => '#64748b', // Slate
            'parent_id' => $raw->id
        ]);
    }
}