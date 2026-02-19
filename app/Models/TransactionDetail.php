<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity; // <- 1. Import Trait
use Spatie\Activitylog\LogOptions;

class TransactionDetail extends Model
{
    use HasFactory, LogsActivity;
    // Tambahkan ini agar tidak error "Mass Assignment"
    protected $fillable = [
        'transaction_id',
        'product_id',
        'location_id',
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

    // Relasi ke Produk (agar nanti bisa ambil nama barang)
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Relasi ke Header Transaksi
    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }
}