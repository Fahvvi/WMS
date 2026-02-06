<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'code', 'color', 'parent_id'];

    // Relasi ke Parent (Kategori Induk)
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // Relasi ke Children (Sub-kategori)
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
    
    // Helper: Ambil Kode Lengkap (Misal: EL-SP) - Opsional
    public function getFullCodeAttribute()
    {
        return $this->parent ? $this->parent->code . '-' . $this->code : $this->code;
    }
}
