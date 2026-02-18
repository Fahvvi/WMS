<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Inertia\Testing\Concerns\Has;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Product extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'name', 
        'sku', 
        'barcode', 
        'description', 
        'unit',             // <--- Wajib ada
        'category',         // <--- Tambahkan juga jaga-jaga
        'min_stock_alert'   // <--- Tambahkan juga
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()          // Melacak perubahan pada semua atribut di $fillable
            ->logOnlyDirty()         // Hanya mencatat kolom yang benar-benar BERUBAH
            ->dontSubmitEmptyLogs()  // Abaikan log jika tidak ada perubahan sama sekali
            ->setDescriptionForEvent(fn(string $eventName) => "Model ini di-{$eventName}");
    }

    protected static function booted()
    {
        static::creating(function ($product) {
            if (empty($product->barcode)) {
                $product->barcode = mt_rand(1000000000000, 9999999999999);
            }
        });
    }
    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }

    
}