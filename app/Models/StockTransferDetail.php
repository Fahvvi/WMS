<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity; // <- 1. Import Trait
use Spatie\Activitylog\LogOptions;


class StockTransferDetail extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'stock_transfer_id',
        'product_id',
        'quantity',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()          // Melacak perubahan pada semua atribut di $fillable
            ->logOnlyDirty()         // Hanya mencatat kolom yang benar-benar BERUBAH
            ->dontSubmitEmptyLogs()  // Abaikan log jika tidak ada perubahan sama sekali
            ->setDescriptionForEvent(fn(string $eventName) => "Model ini di-{$eventName}");
    }

    public function transfer()
    {
        return $this->belongsTo(StockTransfer::class, 'stock_transfer_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    
}

