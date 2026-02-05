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
    Schema::create('transactions', function (Blueprint $table) {
        $table->id();
        $table->string('trx_number')->unique(); // No Surat Jalan / TRX Code
        $table->enum('type', ['inbound', 'outbound']); // Tipe Transaksi
        
        $table->foreignId('user_id')->constrained(); // Siapa yang input (History User)
        $table->foreignId('warehouse_id')->constrained(); // Gudang mana
        
        $table->date('trx_date');
        $table->enum('status', ['draft', 'approved', 'completed', 'cancelled'])->default('draft');
        $table->text('notes')->nullable();
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
