<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. TABEL HEADER TRANSFER (Informasi Umum)
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number')->unique(); // TRF-20261010-001
            $table->date('transfer_date');
            $table->foreignId('user_id')->constrained('users'); // Pembuat
            $table->foreignId('from_warehouse_id')->constrained('warehouses'); // Asal
            $table->foreignId('to_warehouse_id')->constrained('warehouses');   // Tujuan
            $table->text('notes')->nullable();
            $table->string('status')->default('pending'); // pending, approved, completed, rejected
            $table->timestamps();
        });

        // 2. TABEL DETAIL TRANSFER (Barang apa saja yang dipindah)
        Schema::create('stock_transfer_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_transfer_id')->constrained('stock_transfers')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products');
            $table->integer('quantity');
            $table->timestamps();
        });

        // 3. TABEL ADJUSTMENT (Stock Opname Manual Sederhana - Opsional jika sudah pakai StockOpname khusus)
        // Kita biarkan saja agar tidak error jika ada kode lama yang pakai
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_number')->unique();
            $table->date('adjustment_date');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('product_id')->constrained('products');
            $table->string('type'); 
            $table->integer('quantity'); 
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfer_details'); // Hapus detail dulu karena foreign key
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('stock_adjustments');
    }
};