import { usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import NavLink from '@/Components/NavLink'; // Atau sesuaikan dengan komponen NavLink Anda
import { 
    LayoutDashboard, 
    Tags, 
    Users, 
    ShieldCheck, 
    Warehouse, 
    Settings,
    Package
} from 'lucide-react'; // Pastikan library icon ini ada, atau ganti dengan icon yang Anda pakai

export default function SettingsLayout({ children, title }) {
    const { auth } = usePage().props;
    
    // Ambil Permissions & Roles dari User yang sedang login
    // FIX: Ambil permission dari auth.permissions (sesuai AuthenticatedLayout) agar terbaca
    const userPermissions = auth.permissions || auth.user.permissions || [];

    // FIX: Mapping Role Object ke Array String (karena auth.user.roles biasanya array of objects)
    const rawRoles = auth.user.roles || [];
    const userRoles = Array.isArray(rawRoles) 
        ? rawRoles.map(r => (typeof r === 'object' ? r.name : r)) 
        : [];
    if (auth.user.role) userRoles.push(auth.user.role);

    // Helper: Cek apakah User punya izin ATAU dia Super Admin
    const can = (permissionName) => {
        const isSuperAdmin = userRoles.some(r => r.toLowerCase() === 'super admin');
        return isSuperAdmin || userPermissions.includes(permissionName);
    };

    // Daftar Menu yang akan dirender secara dinamis
    const menuItems = [
        {
            label: 'Overview',
            route: 'settings.index',
            active: 'settings.index',
            icon: <LayoutDashboard className="w-5 h-5" />,
            permission: 'view_settings' // Syarat minimal masuk settings
        },
        {
            label: 'Material Creation',
            route: 'settings.materials.create', // Pastikan route ini ada di web.php
            active: 'settings.materials.*',
            icon: <Package className="w-5 h-5" />,
            permission: 'create_products' // Gunakan 'manage_categories' agar Staff bisa akses
        },
        {
            label: 'Kategori Barang',
            route: 'settings.categories.index', // Tambah prefix 'settings.'
            active: 'settings.categories.*',
            icon: <Tags className="w-5 h-5" />,
            permission: 'manage_categories' // Permission khusus Kategori
        },
        {
            label: 'Gudang & Unit',
            route: 'settings.warehouses.index', // Tambah prefix 'settings.'
            active: 'settings.warehouses.*',
            icon: <Warehouse className="w-5 h-5" />,
            permission: 'manage_warehouses' // Permission khusus Gudang
        },
        {
            label: 'Manajemen User',
            route: 'settings.users.index', // Tambah prefix 'settings.'
            active: 'settings.users.*',
            icon: <Users className="w-5 h-5" />,
            permission: 'manage_users' // Permission khusus User
        },
        {
            label: 'Role & Izin',
            route: 'settings.roles.index', // Tambah prefix 'settings.'
            active: 'settings.roles.*',
            icon: <ShieldCheck className="w-5 h-5" />,
            permission: 'manage_roles' // Permission khusus Role
        },
         // Tambahkan menu lain disini, misal:
         // { label: 'Satuan Unit', route: 'units.index', permission: 'manage_units' },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">{title || 'Pengaturan'}</h2>}
        >
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* SIDEBAR DINAMIS */}
                        <aside className="w-full md:w-64 flex-shrink-0">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg sticky top-6">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-indigo-600" />
                                        Menu Pengaturan
                                    </h3>
                                </div>
                                <nav className="p-2 space-y-1">
                                    {menuItems.map((item, index) => (
                                        // RENDER HANYA JIKA USER PUNYA IZIN
                                        can(item.permission) && (
                                            <NavLink 
                                                key={index}
                                                href={route(item.route)} 
                                                active={route().current(item.active)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                                    route().current(item.active)
                                                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                <span className={`${route().current(item.active) ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                    {item.icon}
                                                </span>
                                                {item.label}
                                            </NavLink>
                                        )
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        {/* KONTEN UTAMA */}
                        <main className="flex-1">
                            {children}
                        </main>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}