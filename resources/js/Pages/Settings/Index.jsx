import React from 'react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Tags, 
    Warehouse, 
    Users, 
    ShieldCheck, 
    LayoutDashboard,
    Package
} from 'lucide-react';

export default function SettingsIndex() {
    const { auth } = usePage().props;

    // --- LOGIC PENGECEKAN PERMISSION (Sama dengan Layout) ---
    const userPermissions = auth.permissions || auth.user.permissions || [];
    const rawRoles = auth.user.roles || [];
    const userRoles = Array.isArray(rawRoles) 
        ? rawRoles.map(r => (typeof r === 'object' ? r.name : r)) 
        : [];
    if (auth.user.role) userRoles.push(auth.user.role);

    const can = (permissionName) => {
        const isSuperAdmin = userRoles.some(r => r.toLowerCase().includes('admin'));
        return isSuperAdmin || userPermissions.includes(permissionName);
    };

    // --- DAFTAR MENU (KARTU) ---
    const menuCards = [
        {
            title: 'Kategori Barang',
            description: 'Kelola kategori produk untuk pengelompokan barang.',
            icon: <Tags className="w-8 h-8 text-white" />,
            color: 'bg-pink-500',
            route: 'settings.categories.index',
            permission: 'manage_categories'
        },
        {
            title: 'Data Gudang',
            description: 'Tambah atau edit lokasi gudang penyimpanan.',
            icon: <Warehouse className="w-8 h-8 text-white" />,
            color: 'bg-blue-500',
            route: 'settings.warehouses.index',
            permission: 'manage_warehouses'
        },
        {
            title: 'Material & Produk',
            description: 'Buat data master produk dan kelola material baru.',
            icon: <Package className="w-8 h-8 text-white" />, // Pastikan icon Package diimport
            color: 'bg-orange-500', // Beri warna berbeda
            route: 'settings.materials.create',
            permission: 'create_products' // Samakan permission dengan Layout
        },
        {
            title: 'Manajemen User',
            description: 'Kelola akun pengguna, reset password, dan data staff.',
            icon: <Users className="w-8 h-8 text-white" />,
            color: 'bg-indigo-500',
            route: 'settings.users.index',
            permission: 'manage_users'
        },
        {
            title: 'Role & Hak Akses',
            description: 'Atur jabatan dan izin akses untuk setiap pengguna.',
            icon: <ShieldCheck className="w-8 h-8 text-white" />,
            color: 'bg-purple-500',
            route: 'settings.roles.index',
            permission: 'manage_roles'
        },
        // Tambahkan menu lain jika ada (misal: Unit, Atribut, dll)
        {
            title: 'Satuan Unit',
            description: 'Atur satuan pengukuran barang (Pcs, Kg, Box).',
            icon: <Package className="w-8 h-8 text-white" />,
            color: 'bg-emerald-500',
            route: 'settings.attributes.index', // Pastikan route ini ada jika ingin dipakai
            permission: 'manage_categories' // Biasanya digabung dengan kategori
        }
    ];

    return (
        <SettingsLayout title="Overview Pengaturan">
            <Head title="Pengaturan" />

            <div className="space-y-6">
                {/* Bagian Header Sambutan */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800">
                        Halo, {auth.user.name}! 👋
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Selamat datang di panel pengaturan. Silakan pilih menu di bawah ini untuk mengelola konfigurasi sistem WMS Anda.
                    </p>
                </div>

                {/* Grid Kartu Menu */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuCards.map((card, index) => (
                        // Render kartu HANYA jika user punya izin
                        can(card.permission) && (
                            <Link 
                                key={index} 
                                href={route(card.route)}
                                className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col items-start"
                            >
                                <div className={`p-3 rounded-xl shadow-lg mb-4 ${card.color} group-hover:scale-110 transition-transform duration-200`}>
                                    {card.icon}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    {card.description}
                                </p>
                            </Link>
                        )
                    ))}
                </div>

                {/* Pesan jika tidak ada menu sama sekali (Jaga-jaga) */}
                {menuCards.filter(c => can(c.permission)).length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500">Anda tidak memiliki akses ke menu pengaturan apa pun.</p>
                    </div>
                )}
            </div>
        </SettingsLayout>
    );
}