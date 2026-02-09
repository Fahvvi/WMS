<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    use HasFactory;

    protected $guarded = [];

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