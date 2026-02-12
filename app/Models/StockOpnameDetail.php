<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockOpnameDetail extends Model {
    protected $fillable = ['stock_opname_id', 'product_id', 'system_stock', 'physical_stock', 'difference'];

    public function product() { return $this->belongsTo(Product::class); }
}