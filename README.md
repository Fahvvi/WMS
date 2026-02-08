# 📦 WMS Pro (Warehouse Management System)

![WMS Pro Banner](https://img.shields.io/badge/Status-Development-orange) ![Laravel](https://img.shields.io/badge/Laravel-12.x-red) ![React](https://img.shields.io/badge/React-Inertia-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4)

Sistem Manajemen Gudang (WMS) modern yang dirancang untuk efisiensi tinggi dengan fitur **Barcode Scanner First**, manajemen stok real-time, dan antarmuka *Enterprise-grade*.

Dibuat untuk memudahkan proses Inbound, Outbound, dan Stock Opname dengan pengalaman pengguna (UX) yang minim klik.

## 🚀 Fitur Unggulan

### 1. 📷 Inbound Scanner Mode
- **Scan-to-Action:** Input barang masuk hanya dengan barcode scanner tanpa mouse.
- **Auto Detection:** Otomatis mendeteksi barang yang sudah ada.
- **Quick Add Modal:** Jika barang belum terdaftar, popup modal muncul otomatis untuk registrasi cepat.

### 2. 📊 Interactive Dashboard
- Statistik Total Produk & Stok Fisik.
- Grafik/List Inbound & Outbound terbaru.
- Monitoring User Aktif & Log Aktivitas (Timeline).

### 3. 📦 Master Inventory (Enterprise Grid)
- Tampilan Data Grid yang padat dan informatif.
- Indikator **Low Stock Alert** (Warna merah jika stok menipis).
- CRUD Lengkap (Edit & Hapus dengan proteksi).
- Cetak Label/Barcode Produk.

### 4. ⚙️ Pengaturan & Utilitas
- **Multi-Warehouse Management:** Tambah/Edit lokasi gudang.
- **Attribute Management:** Kelola Satuan (Pcs, Box) & Kategori.
- **User Management:** Hak akses Superadmin & Staff.

---

## 🛠️ Teknologi yang Digunakan

* **Backend:** [Laravel 12](https://laravel.com)
* **Frontend:** [React.js](https://reactjs.org) via [Inertia.js](https://inertiajs.com)
* **Styling:** [Tailwind CSS](https://tailwindcss.com)
* **Icons:** [Lucide React](https://lucide.dev)
* **Database:** PostgreSQL / MySQL

---

## 📸 Screenshots

*(Silakan drag & drop screenshot aplikasi Anda di area ini)*

| Dashboard | Inbound Scanner |
|Str|Str|
| ![Dashboard](link-gambar-dashboard-anda) | ![Inbound](link-gambar-inbound-anda) |

| Inventory Grid | Settings |
|Str|Str|
| ![Inventory](link-gambar-inventory-anda) | ![Settings](link-gambar-settings-anda) |

---

## 💻 Cara Instalasi (Local Development)

Ikuti langkah ini untuk menjalankan proyek di komputer lokal:

### Prasyarat
- PHP >= 8.2
- Composer
- Node.js & NPM
- PostgreSQL / MySQL

### Langkah-langkah

1.  **Clone Repositori**
    ```bash
    git clone [https://github.com/Fahvvi/WMS.git](https://github.com/Fahvvi/WMS.git)
    cd WMS
    ```

2.  **Install Dependencies**
    ```bash
    composer install
    npm install
    ```

3.  **Setup Environment**
    Salin file `.env.example` menjadi `.env` dan atur koneksi database Anda.
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

4.  **Migrasi Database**
    ```bash
    php artisan migrate
    ```

5.  **Jalankan Aplikasi**
    Buka dua terminal terpisah untuk menjalankan server Laravel dan Vite (Frontend).

    *Terminal 1:*
    ```bash
    php artisan serve
    ```

    *Terminal 2:*
    ```bash
    npm run dev
    ```

6.  **Akses Aplikasi**
    Buka browser dan kunjungi `http://localhost:8000`

---

## 📝 To-Do / Roadmap

- [x] Inbound Scanner Logic
- [x] Master Inventory CRUD
- [x] Warehouse Management
- [x] Dashboard Analytics
- [ ] Fitur Cetak Surat Jalan (Delivery Order)
- [ ] Laporan PDF Export
- [ ] Stock Opname Adjustment

---

## 🔒 License

Proyek ini adalah *proprietary software* untuk penggunaan internal/pribadi. Untuk kebutuhan PT Selaras Donlim Indonesia

