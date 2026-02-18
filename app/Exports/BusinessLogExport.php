<?php

namespace App\Exports;

use Spatie\Activitylog\Models\Activity;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BusinessLogExport implements FromQuery, WithHeadings, WithMapping, WithStyles
{
    protected $search;
    protected $menu;
    protected $date;

    // Terima parameter filter dari controller
    public function __construct($search, $menu, $date)
    {
        $this->search = $search;
        $this->menu = $menu;
        $this->date = $date;
    }

    // Terapkan filter ke query export
    public function query()
    {
        $query = Activity::with('causer')->latest();

        if ($this->search) {
            $query->whereHas('causer', function ($q) {
                $q->where('name', 'like', '%' . $this->search . '%');
            });
        }

        if ($this->menu) {
            $query->where('subject_type', 'like', '%' . $this->menu . '%');
        }

        if ($this->date) {
            $query->whereDate('created_at', $this->date);
        }

        return $query;
    }

    // Judul Kolom Excel
    public function headings(): array
    {
        return [
            'ID',
            'Tanggal & Waktu',
            'Aktor (User)',
            'Menu (Subject)',
            'Aksi (Event)',
            'IP Address',
            'Detail Perubahan (JSON)',
        ];
    }

    // Mapping Data per Baris
    public function map($log): array
    {
        // Ekstrak nama menu
        $menuName = $log->subject_type ? class_basename($log->subject_type) : 'Sistem';
        
        // Ekstrak IP
        $ip = $log->properties['ip_address'] ?? $log->properties['ip'] ?? '-';

        return [
            $log->id,
            $log->created_at->format('Y-m-d H:i:s'),
            $log->causer ? $log->causer->name : 'Sistem / Guest',
            $menuName . ($log->subject_id ? " (ID: {$log->subject_id})" : ''),
            strtoupper($log->event),
            $ip,
            // Convert array properties kembali ke JSON string untuk Excel
            json_encode($log->properties->toArray(), JSON_UNESCAPED_SLASHES), 
        ];
    }

    // Style Header (Bold)
    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}