<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity; // <- 1. Import Trait
use Spatie\Activitylog\LogOptions;

class Category extends Model
{

    use HasFactory, LogsActivity;
    protected $fillable = ['name', 'code', 'color', 'parent_id'];

    
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()          // Melacak perubahan pada semua atribut di $fillable
            ->logOnlyDirty()         // Hanya mencatat kolom yang benar-benar BERUBAH
            ->dontSubmitEmptyLogs()  // Abaikan log jika tidak ada perubahan sama sekali
            ->setDescriptionForEvent(fn(string $eventName) => "Model ini di-{$eventName}");
    }
    
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
