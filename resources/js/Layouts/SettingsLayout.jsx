import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
// Tambahkan 'Shield' ke dalam import di sini
import { Warehouse, Tag, Package, Users, ChevronRight, Settings, Shield } from 'lucide-react';

export default function SettingsLayout({ children, title }) {
    const { auth } = usePage().props;
    const userRole = auth.user.roles?.[0]?.name || auth.user.role || 'staff';

    // Menu Items
    const menuItems = [
        { 
            name: 'Data Gudang', 
            href: route('settings.warehouses.index'), 
            active: route().current('settings.warehouses.*'),
            icon: <Warehouse size={18} /> 
        },
        { 
            name: 'Atribut (Unit & Kategori)', 
            href: route('settings.attributes.index'), 
            active: route().current('settings.attributes.*'),
            icon: <Tag size={18} /> 
        },
        { 
            name: 'Material Creation', 
            href: route('settings.materials.create'), 
            active: route().current('settings.materials.*'),
            icon: <Package size={18} /> 
        },
        // Menu Manajemen User & Role (Hanya Super Admin)
        ...(userRole === 'Super Admin' || userRole === 'superadmin' ? [
            { 
                name: 'Manajemen User', 
                href: route('settings.users.index'), 
                active: route().current('settings.users.*'),
                icon: <Users size={18} /> 
            },
            { 
                name: 'Manajemen Role', 
                href: route('settings.roles.index'), 
                active: route().current('settings.roles.*'),
                icon: <Shield size={18} /> 
            }
        ] : [])
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={title} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Breadcrumb Header */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                        <Link href={route('dashboard')} className="hover:text-indigo-600 transition">Dashboard</Link>
                        <ChevronRight size={14} />
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Settings size={14} /> Pengaturan
                        </span>
                        {title && (
                            <>
                                <ChevronRight size={14} />
                                <span className="text-indigo-600 font-medium">{title}</span>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        
                        {/* Sidebar Menu */}
                        <div className="w-full lg:w-64 shrink-0">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 text-sm">Menu Pengaturan</h3>
                                </div>
                                <div className="p-2 space-y-1">
                                    {menuItems.map((item, index) => (
                                        <Link
                                            key={index}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                item.active 
                                                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            <span className={`${item.active ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {item.icon}
                                            </span>
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1">
                            {children}
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}