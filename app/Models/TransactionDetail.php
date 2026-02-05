<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionDetail extends Model
{
    // Tambahkan ini agar tidak error "Mass Assignment"
    protected $fillable = [
        'transaction_id',
        'product_id',
        'quantity'
    ];

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
}