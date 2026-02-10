<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\AttributeController;
use App\Http\Controllers\UserController;
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
| Authenticated Routes (Protected)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    // =========================================================================
    // 1. DASHBOARD & PROFILE
    // =========================================================================
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    });

    // =========================================================================
    // 2. MASTER INVENTORY (Products & Stock Transfers)
    // =========================================================================
    
    // A. STOCK TRANSFERS
    Route::prefix('inventory')->name('stock-transfers.')->group(function () {
        Route::get('/transfers', [StockTransferController::class, 'index'])->name('index');
        Route::get('/transfers/create', [StockTransferController::class, 'create'])->name('create');
        Route::post('/transfers', [StockTransferController::class, 'store'])->name('store');
        Route::get('/stocks/{warehouse}', [StockTransferController::class, 'getWarehouseStocks'])->name('get-stocks');
    });

    // B. PRODUCTS (Master Data Barang)
    // Note: Route custom (check/print) HARUS diletakkan SEBELUM Route::resource
    Route::prefix('products')->name('products.')->group(function () {
        Route::get('/check', [ProductController::class, 'check'])->name('check'); // Cek barcode
        Route::get('/{product}/print', [ProductController::class, 'printLabel'])->name('print');
        Route::get('/{product}/history', [ProductController::class, 'history'])->name('history');
    });
    
    // Resource Produk (index, store, update, destroy)
    Route::resource('products', ProductController::class);


    // =========================================================================
    // 3. TRANSACTIONS (Inbound / Outbound)
    // =========================================================================
    Route::prefix('transactions')->name('transactions.')->group(function () {
        Route::get('/', [TransactionController::class, 'index'])->name('index');
        Route::get('/create', [TransactionController::class, 'create'])->name('create');
        Route::post('/', [TransactionController::class, 'store'])->name('store');
    });


    // =========================================================================
    // 4. SETTINGS GROUP (Semua menu di sidebar 'Settings')
    // =========================================================================
    Route::prefix('settings')->name('settings.')->middleware(['role:Super Admin|Supervisor'])->group(function () {
        
        // A. MANAJEMEN USER (RBAC)
        Route::resource('users', UserController::class)
            ->middleware(['role:Super Admin']);
        // B. GUDANG (Tampilan View di Menu Settings)
        // URL: /settings/warehouses -> Name: settings.warehouses.index
        Route::get('/warehouses', [SettingController::class, 'warehouseIndex'])->name('warehouses.index');

        // C. MATERIAL CREATION (Tampilan View)
        Route::get('/materials', [SettingController::class, 'materialCreate'])->name('materials.create');

        // D. ATTRIBUTES (Page Unit & Kategori)
        Route::get('/attributes', [AttributeController::class, 'index'])->name('attributes.index');

        // E. Roles
       Route::resource('roles', \App\Http\Controllers\RoleController::class)
            ->except(['create', 'show', 'edit'])
            ->middleware(['role:Super Admin']);
        // --- AKSI CRUD UNTUK ATRIBUT (Dipanggil via Modal di page Attributes) ---
        
        // Units
        Route::post('/units', [AttributeController::class, 'storeUnit'])->name('units.store');
        Route::put('/units/{unit}', [AttributeController::class, 'updateUnit'])->name('units.update');
        Route::delete('/units/{unit}', [AttributeController::class, 'destroyUnit'])->name('units.destroy');

        // Categories (Menggunakan AttributeController sesuai logika page Attributes)
        Route::post('/categories', [AttributeController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [AttributeController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{category}', [AttributeController::class, 'destroyCategory'])->name('categories.destroy');
    });


    // =========================================================================
    // 5. ROOT RESOURCES (Action Handlers)
    // =========================================================================
    
    // GUDANG (CRUD Action)
    // Ditaruh di luar group 'settings' agar nama rutenya tetap standar 'warehouses.store', 
    // sehingga kita tidak perlu mengubah form React yang sudah ada.
    Route::resource('warehouses', WarehouseController::class)->except(['index', 'create', 'edit', 'show']);

});

require __DIR__.'/auth.php';