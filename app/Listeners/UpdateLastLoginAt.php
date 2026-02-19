<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Carbon;

class UpdateLastLoginAt
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        // Update kolom last_login_at milik user yang baru saja berhasil login
        $event->user->update([
            'last_login_at' => Carbon::now(),
        ]);
    }
}