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
    Schema::create('products', function (Blueprint $table) {
        $table->id();
        $table->string('sku')->unique(); // Kode Barang (Manual)
        $table->string('barcode')->unique()->nullable(); // Barcode Scan (Bisa Auto)
        $table->string('name');
        $table->text('description')->nullable();
        $table->string('category')->nullable();
        $table->string('unit')->default('pcs'); // pcs, box, kg
        $table->integer('min_stock_alert')->default(10); // Notifikasi jika stok tipis
        $table->string('image_path')->nullable(); // Foto barang
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
