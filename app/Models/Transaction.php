<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    // HAPUS USE SPATIE DISINI JIKA ADA

    protected $guarded = ['id']; // Gunakan guarded id agar semua field bisa diisi

    // Relasi
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function details()
    {
        return $this->hasMany(TransactionDetail::class);
    }
}