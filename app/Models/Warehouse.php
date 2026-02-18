<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity; // <- 1. Import Trait
use Spatie\Activitylog\LogOptions;

class Warehouse extends Model
{
    use HasFactory, LogsActivity;
    protected $fillable = [
        'code',
        'name',
        'address',
        'city',
        'is_active'
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('Warehouse')
            ->logOnly(['code', 'name', 'address', 'city', 'is_active'])
            ->setDescriptionForEvent(fn(string $eventName) => "Warehouse has been {$eventName}");
    }
}