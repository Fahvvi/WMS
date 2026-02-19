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
    Schema::create('stocks', function (Blueprint $table) {
        $table->id();
        $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
        $table->foreignId('product_id')->constrained()->cascadeOnDelete();
        $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
        $table->integer('quantity')->default(0);
        $table->timestamps();

        // Mencegah duplikasi: 1 produk hanya punya 1 record stok di 1 gudang yang sama
        $table->unique(['warehouse_id', 'product_id', 'location_id']);
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
