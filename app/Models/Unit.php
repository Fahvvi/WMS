<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity; // <- 1. Import Trait
use Spatie\Activitylog\LogOptions;

class Unit extends Model
{
    use HasFactory, LogsActivity; // <- 2. Pasang Trait di sini
    protected $fillable = ['name', 'short_name'];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('unit')
            ->logOnly(['name', 'short_name'])
            ->setDescriptionForEvent(fn(string $eventName) => "Unit has been {$eventName}");
    }

    }
