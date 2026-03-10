<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class StaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Pastikan role 'staff' sudah ada
        $role = Role::firstOrCreate(['name' => 'Staff']);

        // 2. Data Staff dari tabel
        $staffData = [
            ['nip' => '5000286', 'name' => 'CHATUR MUNANDAR'],
            ['nip' => '5000292', 'name' => 'FIKRI RAMADHAN NANDA'],
            ['nip' => '5002477', 'name' => 'ANASTASIA BUDIMAN'],
            ['nip' => '5001771', 'name' => 'ANDREA GHEA IRWANSYAH'],
            ['nip' => '5000307', 'name' => 'RESHA SRI ASTUTI'],
            ['nip' => '5000287', 'name' => 'AGUNG SETIYABUDI'],
            ['nip' => '5000310', 'name' => 'ACHMAD ALPIAN'],
            ['nip' => '5000288', 'name' => 'ASEP SUJANA'],
            ['nip' => '5000291', 'name' => 'ELGA MAULANA SUBAGJA'],
            ['nip' => '5000314', 'name' => 'MUHAMMAD NUR ISKANDAR'],
            ['nip' => '5000294', 'name' => 'MUHAMAD SARBINI'],
            ['nip' => '5000315', 'name' => 'NANTA MUSA PUTRA'],
            ['nip' => '5001768', 'name' => 'ALFIAN HILMIS'],
            ['nip' => '5001770', 'name' => 'RIZKY IBNU MUBAROK'],
            ['nip' => '5001772', 'name' => 'MAHPUDIN'],
            ['nip' => '5001782', 'name' => 'ZAENAL ARIFIN'],
            ['nip' => '5001778', 'name' => 'KRISHNA'],
            ['nip' => '5001779', 'name' => 'AHMAD KORI'],
            ['nip' => '5001780', 'name' => 'HAERUDIN'],
            ['nip' => '5001781', 'name' => 'ROHMAN'],
            ['nip' => '5002583', 'name' => 'RIYAN HIDAYAT'],
            ['nip' => '5002908', 'name' => 'RIFALDI YANSYAH'],
            ['nip' => '5002934', 'name' => 'KHOIRUL ANWAR'],
            ['nip' => '5002951', 'name' => 'ADI WIJAYA'],
            ['nip' => '5002952', 'name' => 'MUHAMAD RYAN CHISARA'],
            ['nip' => '5002964', 'name' => 'DEFRAN SYEPRUDIN'],
            ['nip' => '5002985', 'name' => 'INDRA PRATAMA'],
        ];

        // 3. Looping untuk insert ke Database menggunakan NIP
        foreach ($staffData as $data) {
            $user = User::updateOrCreate(
                // Parameter pencarian: Cek apakah NIP ini sudah ada di database
                ['nip' => $data['nip']], 
                [
                    // Parameter update/insert
                    'name' => $data['name'],
                    'password' => Hash::make('password'),
                    
                    // Opsional: Jika kolom email di database Anda belum di-set nullable, 
                    // kita berikan email dummy agar tidak error constraint.
                    'email' => $data['nip'] . '@wms.local', 
                ]
            );

            // 4. Berikan hak akses 'staff'
            $user->assignRole($role);
        }

        $this->command->info('Berhasil menambahkan ' . count($staffData) . ' user Staff dengan akses NIP!');
    }
}