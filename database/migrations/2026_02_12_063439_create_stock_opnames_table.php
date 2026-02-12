<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('stock_opnames', function (Blueprint $table) {
        $table->id();
        $table->string('opname_number')->unique(); // SO-20260212-0001
        $table->foreignId('warehouse_id')->constrained();
        $table->foreignId('user_id')->constrained();
        $table->date('opname_date');
        $table->text('notes')->nullable();
        $table->timestamps();
    });

    Schema::create('stock_opname_details', function (Blueprint $table) {
        $table->id();
        $table->foreignId('stock_opname_id')->constrained()->onDelete('cascade');
        $table->foreignId('product_id')->constrained();
        $table->integer('system_stock'); // Stok di aplikasi saat itu
        $table->integer('physical_stock'); // Stok yang dihitung manual
        $table->integer('difference'); // Selisih (Fisik - Sistem)
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_opnames');
    }
};
