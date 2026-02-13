<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
    {
        // 1. Tabel Header (Informasi Dokumen)
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->string('opname_number')->unique();
            $table->date('opname_date');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('user_id')->constrained('users'); // Pembuat dokumen
            $table->text('notes')->nullable();
            $table->string('status')->default('completed'); // Status dokumen
            $table->timestamps();
        });

        // 2. Tabel Detail (Item Barang)
        Schema::create('stock_opname_details', function (Blueprint $table) {
            $table->id();
            // Relasi ke Header
            $table->foreignId('stock_opname_id')->constrained('stock_opnames')->onDelete('cascade');
            
            // Relasi ke Produk
            $table->foreignId('product_id')->constrained('products');
            
            // --- KOLOM PENTING YANG SEBELUMNYA HILANG ---
            $table->integer('system_qty'); // Stok menurut sistem saat opname dibuat
            $table->integer('actual_qty'); // Stok fisik hasil hitungan user
            // --------------------------------------------
            $table->text('notes')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opname_details');
        Schema::dropIfExists('stock_opnames');
    }
};
