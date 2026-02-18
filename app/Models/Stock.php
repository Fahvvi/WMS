<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity; // <- 1. Import Trait
use Spatie\Activitylog\LogOptions;

class Stock extends Model
{
    use HasFactory, LogsActivity;

    protected $guarded = [];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()          // Melacak perubahan pada semua atribut di $fillable
            ->logOnlyDirty()         // Hanya mencatat kolom yang benar-benar BERUBAH
            ->dontSubmitEmptyLogs()  // Abaikan log jika tidak ada perubahan sama sekali
            ->setDescriptionForEvent(fn(string $eventName) => "Model ini di-{$eventName}");
    }

    // Relasi ke Produk (PENTING: Agar $stock->product tidak error)
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Relasi ke Gudang
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}