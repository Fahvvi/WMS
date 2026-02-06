<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
// use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Product extends Model
{
    // use LogsActivity;

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
        ->logOnly(['name', 'sku', 'barcode', 'unit']) // Tambahkan unit ke log juga
        ->logOnlyDirty()
        ->setDescriptionForEvent(fn(string $eventName) => "Product has been {$eventName}");
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