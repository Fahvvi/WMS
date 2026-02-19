<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider; 
use Illuminate\Support\Facades\Event;
use Illuminate\Auth\Events\Login;
use App\Listeners\UpdateLastLoginAt;
use Illuminate\Support\Facades\Vite;

class AppServiceProvider extends ServiceProvider // <--- UBAH NAMA CLASS JADI INI
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        
        // Daftarkan event listener
        Event::listen(
            Login::class,
            UpdateLastLoginAt::class,
        );
    }
}