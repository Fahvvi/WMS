<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            // Relasi ke Gudang Induk
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            
            // Kode Unik Titik Lokasi (Misal: WH1-A-01-3-05)
            $table->string('code')->unique(); 
            
            // Hirarki Lokasi
            $table->string('aisle')->nullable()->comment('Lorong');
            $table->string('rack')->nullable()->comment('Rak');
            $table->string('level')->nullable()->comment('Tingkat/Lantai Rak');
            $table->string('bin')->nullable()->comment('Kotak/Posisi Spesifik');
            
            // Tipe Lokasi (Penting untuk Enterprise)
            $table->enum('type', ['storage', 'receiving', 'shipping', 'quarantine'])
                  ->default('storage')
                  ->comment('storage: Penyimpanan, receiving: Penerimaan Sementara, shipping: Area Transit Keluar, quarantine: Barang Rusak/Hold');
            
            $table->integer('max_capacity')->nullable()->comment('Maksimal Kapasitas (Kg / Pcs)');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};