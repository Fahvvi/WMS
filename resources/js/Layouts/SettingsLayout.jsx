import { usePage } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- UBAH IMPORT INI
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import NavLink from '@/Components/NavLink'; 
import { 
    LayoutDashboard, 
    Tags, 
    Users, 
    ShieldCheck, 
    Warehouse, 
    Settings,
    Package,
    History
} from 'lucide-react';

export default function SettingsLayout({ children, title }) {
    const { auth } = usePage().props;
    const { t } = useLaravelReactI18n(); // <--- GUNAKAN I18N DI SINI
    
    // Ambil Permissions & Roles dari User yang sedang login
    const userPermissions = auth.permissions || auth.user.permissions || [];

    // Mapping Role Object ke Array String
    const rawRoles = auth.user.roles || [];
    const userRoles = Array.isArray(rawRoles) 
        ? rawRoles.map(r => (typeof r === 'object' ? r.name : r)) 
        : [];
    if (auth.user.role) userRoles.push(auth.user.role);

    // Helper: Cek apakah User punya izin ATAU dia Super Admin
    const can = (permissionName) => {
        const isSuperAdmin = userRoles.some(r => r.toLowerCase().includes('admin')); // Lebih aman pakai includes
        return isSuperAdmin || userPermissions.includes(permissionName);
    };

    // Daftar Menu yang akan dirender secara dinamis
    const menuItems = [
        {
            label: t('Overview'),
            route: 'settings.index',
            active: 'settings.index',
            icon: <LayoutDashboard className="w-5 h-5" />,
            permission: 'view_settings'
        },
        {
            label: t('Material Creation'),
            route: 'settings.materials.create', 
            active: 'settings.materials.*',
            icon: <Package className="w-5 h-5" />,
            permission: 'create_products' 
        },
        {
            label: t('Kategori Barang'),
            route: 'settings.categories.index', 
            active: 'settings.categories.*',
            icon: <Tags className="w-5 h-5" />,
            permission: 'manage_categories' 
        },
        {
            label: t('Gudang & Unit'),
            route: 'settings.warehouses.index', 
            active: 'settings.warehouses.*',
            icon: <Warehouse className="w-5 h-5" />,
            permission: 'manage_warehouses' 
        },
        {
            label: t('Manajemen User'),
            route: 'settings.users.index', 
            active: 'settings.users.*',
            icon: <Users className="w-5 h-5" />,
            permission: 'manage_users' 
        },
        {
            label: t('Role & Izin'),
            route: 'settings.roles.index', 
            active: 'settings.roles.*',
            icon: <ShieldCheck className="w-5 h-5" />,
            permission: 'manage_roles' 
        },
        {
            label: t('Log Aktivitas'),
            route: 'settings.business-log', 
            active: 'settings.business-log',
            icon: <History className="w-5 h-5" />,
            permission: 'view_business_log' 
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            // --- HEADER JUGA DISESUAIKAN DARK MODE-NYA ---
            header={<h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 leading-tight">{title || t('Settings')}</h2>}
        >
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* SIDEBAR DINAMIS */}
                        <aside className="w-full md:w-64 flex-shrink-0">
                            {/* --- BOX SIDEBAR DARK MODE --- */}
                            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm sm:rounded-2xl border border-slate-200 dark:border-slate-700 sticky top-24 transition-colors duration-200">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        {t('Menu Pengaturan')}
                                    </h3>
                                </div>
                                <nav className="p-3 space-y-1">
                                    {menuItems.map((item, index) => (
                                        can(item.permission) && (
                                            <NavLink 
                                                key={index}
                                                href={route(item.route)} 
                                                active={route().current(item.active)}
                                                // --- MENU ITEM DARK MODE ---
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                                    route().current(item.active)
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                                                }`}
                                            >
                                                {/* --- ICON DARK MODE --- */}
                                                <span className={`${route().current(item.active) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
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