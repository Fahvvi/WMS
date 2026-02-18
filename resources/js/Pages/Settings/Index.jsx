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
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N YANG BENAR

export default function SettingsIndex() {
    const { auth } = usePage().props;
    const { t } = useLaravelReactI18n(); // <--- GUNAKAN HOOK I18N

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
            title: t('Kategori Barang'),
            description: t('Kelola kategori produk untuk pengelompokan barang.'), // Bungkus dengan t()
            icon: <Tags className="w-8 h-8 text-white" />,
            color: 'bg-pink-500 dark:bg-pink-600',
            route: 'settings.categories.index',
            permission: 'manage_categories'
        },
        {
            title: t('Data Gudang'),
            description: t('Tambah atau edit lokasi gudang penyimpanan.'), // Bungkus dengan t()
            icon: <Warehouse className="w-8 h-8 text-white" />,
            color: 'bg-blue-500 dark:bg-blue-600',
            route: 'settings.warehouses.index',
            permission: 'manage_warehouses'
        },
        {
            title: t('Material & Produk'),
            description: t('Buat data master produk dan kelola material baru.'), // Bungkus dengan t()
            icon: <Package className="w-8 h-8 text-white" />, 
            color: 'bg-orange-500 dark:bg-orange-600', 
            route: 'settings.materials.create',
            permission: 'create_products' 
        },
        {
            title: t('Manajemen User'),
            description: t('Kelola akun pengguna, reset password, dan data staff.'), // Bungkus dengan t()
            icon: <Users className="w-8 h-8 text-white" />,
            color: 'bg-indigo-500 dark:bg-indigo-600',
            route: 'settings.users.index',
            permission: 'manage_users'
        },
        {
            title: t('Role & Hak Akses'),
            description: t('Atur jabatan dan izin akses untuk setiap pengguna.'), // Bungkus dengan t()
            icon: <ShieldCheck className="w-8 h-8 text-white" />,
            color: 'bg-purple-500 dark:bg-purple-600',
            route: 'settings.roles.index',
            permission: 'manage_roles'
        },
        {
            title: t('Satuan Unit'),
            description: t('Atur satuan pengukuran barang (Pcs, Kg, Box).'), // Bungkus dengan t()
            icon: <Package className="w-8 h-8 text-white" />,
            color: 'bg-emerald-500 dark:bg-emerald-600',
            route: 'settings.attributes.index', 
            permission: 'manage_categories' 
        }
    ];

    return (
        <SettingsLayout title={t('Overview')}>
            <Head title={t('Settings')} />

            <div className="space-y-6">
                {/* Bagian Header Sambutan */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {t('Halo')}, {auth.user.name}! 👋
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('Selamat datang di panel pengaturan. Silakan pilih menu di bawah ini untuk mengelola konfigurasi sistem WMS Anda.')}
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
                                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-200 flex flex-col items-start"
                            >
                                <div className={`p-3 rounded-xl shadow-lg mb-4 ${card.color} group-hover:scale-110 transition-transform duration-200`}>
                                    {card.icon}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                    {card.description}
                                </p>
                            </Link>
                        )
                    ))}
                </div>

                {/* Pesan jika tidak ada menu sama sekali (Jaga-jaga) */}
                {menuCards.filter(c => can(c.permission)).length === 0 && (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
                        <p className="text-slate-500 dark:text-slate-400">{t('Anda tidak memiliki akses ke menu pengaturan apa pun.')}</p>
                    </div>
                )}
            </div>
        </SettingsLayout>
    );
}