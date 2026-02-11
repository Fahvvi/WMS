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
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard')
        ->middleware(['permission:view_dashboard']);

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
    Route::prefix('products')->name('products.')->middleware(['permission:view_products'])->group(function () {
        Route::get('/check', [ProductController::class, 'check'])->name('check'); // Cek barcode
        Route::get('/{product}/print', [ProductController::class, 'printLabel'])->name('print');
        Route::get('/{product}/history', [ProductController::class, 'history'])->name('history');
    });
    
    // Resource Produk (index, store, update, destroy)
    Route::resource('products', ProductController::class)->middleware(['permission:view_products']);


    // =========================================================================
    // 3. TRANSACTIONS (Inbound / Outbound)
    // =========================================================================
    Route::prefix('transactions')->name('transactions.')->middleware(['auth'])->group(function () {
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

// // --- ROUTE DARURAT: PEMBERSIH DATABASE (HAPUS SETELAH DIPAKAI) ---
// Route::get('/fix-database-now', function () {
//     try {
//         \Illuminate\Support\Facades\DB::transaction(function () {
//             // 1. HAPUS BERSIH SEMUA DATA (Mode PostgreSQL: CASCADE)
//             // Urutan tabel sangat penting!
//             $tables = ['role_has_permissions', 'model_has_roles', 'model_has_permissions', 'permissions', 'roles'];
//             foreach($tables as $table) {
//                 \Illuminate\Support\Facades\DB::statement("TRUNCATE TABLE $table RESTART IDENTITY CASCADE");
//             }
            
//             // 2. BUAT PERMISSION STANDAR (Format: view_noun)
//             $perms = [
//                 // Dashboard
//                 'view_dashboard',
//                 // Transaksi
//                 'view_inbound', 'create_inbound',
//                 'view_outbound', 'create_outbound',
//                 // Inventory
//                 'view_products', 'create_products', 'edit_products', 'delete_products',
//                 'view_transfers', 'create_transfers', 'approve_transfers',
//                 'view_stock_opname',
//                 // Settings
//                 'view_settings',
//                 'manage_users', 'manage_roles', 'manage_warehouses', 'manage_categories'
//             ];

//             foreach ($perms as $p) {
//                 \Spatie\Permission\Models\Permission::create(['name' => $p]);
//             }

//             // 3. SETTING ROLE ULANG
//             $roleSuper = \Spatie\Permission\Models\Role::create(['name' => 'Super Admin']);
//             $roleSuper->syncPermissions(\Spatie\Permission\Models\Permission::all());

//             $roleStaff = \Spatie\Permission\Models\Role::create(['name' => 'Staff']);
//             $roleStaff->syncPermissions([
//                 'view_dashboard', 'view_inbound', 'create_inbound', 
//                 'view_outbound', 'create_outbound', 'view_products', 
//                 'view_transfers', 'create_transfers'
//             ]);

//             // 4. FIX USER (Hubungkan User Anda ke Role)
//             $admin = \App\Models\User::where('email', 'like', '%superadmin%')->first();
//             if($admin) { $admin->assignRole('Super Admin'); $admin->role='Super Admin'; $admin->save(); }

//             $fahmi = \App\Models\User::where('email', 'like', '%fahmi%')->first();
//             if($fahmi) { $fahmi->assignRole('Staff'); $fahmi->role='Staff'; $fahmi->save(); }
//         });

//         return "<h1 style='color:green; text-align:center; margin-top:50px;'>SUKSES! Database Telah Dibersihkan & Dirapikan.</h1>";
//     } catch (\Exception $e) {
//         return "<h1 style='color:red;'>ERROR: " . $e->getMessage() . "</h1>";
//     }
// });

require __DIR__.'/auth.php';