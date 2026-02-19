<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $fillable = [
        'warehouse_id', 'code', 'aisle', 'rack', 
        'level', 'bin', 'type', 'max_capacity', 'is_active'
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }
}