<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\AttributeController;
use App\Http\Controllers\CategoryController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    // --- DASHBOARD ---
    Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

    // --- PROFILE ---
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // --- MODULE: INVENTORY (PRODUCTS) ---
    // PENTING: Route spesifik (check/print) harus DI ATAS resource agar tidak dianggap sebagai ID produk
    Route::get('/products/check', [ProductController::class, 'check'])->name('products.check');
    Route::get('/products/{product}/print', [ProductController::class, 'printLabel'])->name('products.print');
    Route::get('/products/{product}/history', [ProductController::class, 'history'])->name('products.history');

    // Resource CRUD Standar (Index, Store, Update, Destroy)
    Route::resource('products', ProductController::class);

    // --- MODULE: TRANSACTIONS ---
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');

    // --- MODULE: SETTINGS (General, Utility, Warehouse View) ---
    // Semua route di sini akan punya prefix URL '/settings/...'
    Route::prefix('settings')->name('settings.')->group(function () {
        
        // 1. Gudang (Tampilan List masuk ke menu Settings)
        // URL: /settings/warehouses | Name: settings.warehouses.index
        Route::get('/warehouses', [SettingController::class, 'warehouseIndex'])->name('warehouses.index');

        // 2. Attributes (Category & Unit)
        Route::get('/attributes', [AttributeController::class, 'index'])->name('attributes.index');
        
        // Aksi Simpan/Hapus Kategori & Unit
        Route::post('/units', [AttributeController::class, 'storeUnit'])->name('units.store');
        Route::put('/units/{unit}', [AttributeController::class, 'updateUnit'])->name('units.update');
        Route::delete('/units/{unit}', [AttributeController::class, 'destroyUnit'])->name('units.destroy');

        // CRUD Kategori
        Route::post('/categories', [AttributeController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [AttributeController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{category}', [AttributeController::class, 'destroyCategory'])->name('categories.destroy');

        // 3. Users
        Route::resource('users', \App\Http\Controllers\UserController::class)->except(['create', 'show', 'edit']);
    
        // 4. Material Creation
        Route::get('/materials', [SettingController::class, 'materialCreate'])->name('materials.create');
        
        // 5. Manajemen Kategori
        Route::resource('categories', CategoryController::class)->except(['show', 'create', 'edit']);
        });

    // --- LOGIC CRUD GUDANG (Tanpa Tampilan) ---
    // Kita taruh di luar group settings agar nama routenya tetap standar 'warehouses.store', 'warehouses.update'
    // Ini memudahkan agar kita tidak perlu mengubah form React yang sudah ada.
    Route::resource('warehouses', WarehouseController::class)->except(['index', 'create', 'edit', 'show']);

});

require __DIR__.'/auth.php';