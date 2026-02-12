<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockOpname extends Model {
    protected $fillable = ['opname_number', 'warehouse_id', 'user_id', 'opname_date', 'notes'];

    public function details() { return $this->hasMany(StockOpnameDetail::class); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function user() { return $this->belongsTo(User::class); }
}