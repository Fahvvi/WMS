<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. TABEL TRANSFER (Movement dari Rak A ke B)
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number')->unique(); // TRF-20261010-001
            $table->date('transfer_date');
            $table->foreignId('user_id')->constrained('users'); // Siapa yang memindahkan
            $table->foreignId('from_warehouse_id')->constrained('warehouses'); // Dari Gudang Mana
            $table->foreignId('to_warehouse_id')->constrained('warehouses');   // Ke Gudang Mana
            $table->foreignId('product_id')->constrained('products'); // Barang Apa
            $table->integer('quantity'); // Berapa Banyak
            $table->text('notes')->nullable();
            $table->string('status')->default('completed');
            $table->timestamps();
        });

        // 2. TABEL ADJUSTMENT (Stock Opname)
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_number')->unique(); // ADJ-20261010-001
            $table->date('adjustment_date');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('product_id')->constrained('products');
            $table->string('type'); // 'addition' (Tambah) atau 'subtraction' (Kurang)
            $table->integer('quantity'); // Selisihnya
            $table->text('reason')->nullable(); // Alasan: Rusak, Hilang, Ketemu, dll
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('stock_adjustments');
    }
};