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
    Schema::create('categories', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // Nama: "Battery"
        $table->string('code')->unique(); // Kode: "BT" (Wajib Unik)
        $table->string('color')->default('#6366f1'); // Warna Default (Indigo)
        $table->foreignId('parent_id')->nullable()->constrained('categories')->onDelete('set null'); // Fitur Hirarki
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
