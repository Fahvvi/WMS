<?php

namespace App\Models;

use Spatie\Activitylog\Models\Activity as SpatieActivity;

class LogActivity extends SpatieActivity
{
    // Menggunakan event 'creating' bawaan Laravel
    protected static function booted()
    {
        static::creating(function ($activity) {
            // Gabungkan IP Address ke dalam JSON properties setiap kali log dibuat
            $activity->properties = $activity->properties->merge([
                'ip_address' => request()->ip(),
            ]);
        });
    }
}