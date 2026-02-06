import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Warehouse, Tag, Users, Settings, Package } from 'lucide-react';

export default function SettingsLayout({ children, title }) {
    const { url } = usePage();

    const menuItems = [
        { name: 'Data Gudang', href: route('settings.warehouses.index'), icon: <Warehouse size={18} /> },
        { name: 'Atribut (Unit & Kategori)', href: route('settings.attributes.index'), icon: <Tag size={18} /> },
        { name: 'Material Creation', href: route('settings.materials.create'), icon: <Package size={18} /> },
        { name: 'Manajemen User', href: route('settings.users.index'), icon: <Users size={18} /> },
    ];

    return (
        <AuthenticatedLayout
            user={usePage().props.auth.user}
            header={<h2 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5" /> Pengaturan Umum</h2>}
        >
            <Head title={title} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* --- SIDEBAR MENU --- */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                                Menu
                            </div>
                            <nav className="p-2 space-y-1">
                                {menuItems.map((item) => {
                                    const isActive = url.startsWith(new URL(item.href).pathname);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                                                isActive 
                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            {item.icon}
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* --- MAIN CONTENT --- */}
                    <div className="flex-1">
                        {children}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}