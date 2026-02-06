import { useState, useEffect } from 'react'; // Tambahkan useEffect
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, Bell, LogOut, User, LayoutDashboard, Package, ChevronDown, ArrowDownLeft, ArrowUpRight, Settings } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast'; // Tambahkan toast

export default function AuthenticatedLayout({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // --- LOGIC TAMBAHAN: GLOBAL TOAST LISTENER ---
    const { props } = usePage(); 
    const flash = props.flash || {};

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, {
                style: { borderRadius: '10px', background: '#333', color: '#fff' },
            });
        }
        if (flash?.error) {
            toast.error(flash.error, {
                style: { borderRadius: '10px', background: '#ef4444', color: '#fff' },
            });
        }
    }, [flash]);
    // ---------------------------------------------

    return (
        <div className="min-h-screen bg-slate-50">
            {/* PASANG TOASTER Paling Atas */}
            <Toaster 
                position="top-center" 
                toastOptions={{
                    duration: 3000,
                    style: { background: '#334155', color: '#fff' },
                    success: { style: { background: '#10b981' } },
                    error: { style: { background: '#ef4444' } },
                }} 
            />

            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 fixed w-full z-50 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="bg-indigo-600 p-1.5 rounded-lg">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-bold text-xl tracking-tight text-slate-800">WMS<span className="text-indigo-600">Pro</span></span>
                            </Link>

                            <div className="hidden sm:flex sm:space-x-4">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')} icon={<LayoutDashboard size={18}/>}>
                                    Dashboard
                                </NavLink>
                                
                                {/* Menu Inbound */}
                                <NavLink 
                                    href={route('transactions.index', { type: 'inbound' })} 
                                    active={route().current('transactions.index') && route().params.type === 'inbound'} 
                                    icon={<ArrowDownLeft size={18}/>}
                                >
                                    Inbound
                                </NavLink>

                                {/* Menu Outbound */}
                                <NavLink 
                                    href={route('transactions.index', { type: 'outbound' })} 
                                    active={route().current('transactions.index') && route().params.type === 'outbound'} 
                                    icon={<ArrowUpRight size={18}/>}
                                >
                                    Outbound
                                </NavLink>
                                
                                <NavLink href={route('products.index')} active={route().current('products.*')} icon={<Package size={18}/>}>
                                    Inventory
                                </NavLink>

                                <NavLink 
                                    href={route('settings.warehouses.index')} 
                                    active={route().current('settings.*')} 
                                    icon={<Settings size={18}/>}
                                >
                                    General / Settings
                                </NavLink>
                            </div>
                        </div>

                        {/* --- BAGIAN KANAN (PROFILE) --- */}
                        <div className="hidden sm:flex sm:items-center sm:gap-4">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </button>

                            <div className="relative ml-3">
                                <button 
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 focus:outline-none"
                                >
                                    <div className="text-right hidden md:block">
                                        <div className="text-sm font-bold text-slate-700">{user.name}</div>
                                        <div className="text-xs text-slate-500">Superadmin</div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                                        {user.name.charAt(0)}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition ${showProfileMenu ? 'rotate-180' : ''}`}/>
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 origin-top-right ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-3 border-b border-slate-50">
                                            <p className="text-sm text-slate-500">Signed in as</p>
                                            <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                                        </div>
                                        <Link href={route('profile.edit')} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                            <User size={16} /> Profile
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                                            <LogOut size={16} /> Log Out
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="p-2 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none transition"
                            >
                                {showingNavigationDropdown ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Slide */}
                <div className={`${showingNavigationDropdown ? 'block' : 'hidden'} sm:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl`}>
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        <MobileNavLink href={route('dashboard')} active={route().current('dashboard')} icon={<LayoutDashboard size={18}/>}>
                            Dashboard
                        </MobileNavLink>
                        
                        <MobileNavLink href={route('transactions.index', { type: 'inbound' })} active={route().current('transactions.index') && route().params.type === 'inbound'} icon={<ArrowDownLeft size={18}/>}>
                            Inbound
                        </MobileNavLink>
                        
                        <MobileNavLink href={route('transactions.index', { type: 'outbound' })} active={route().current('transactions.index') && route().params.type === 'outbound'} icon={<ArrowUpRight size={18}/>}>
                            Outbound
                        </MobileNavLink>
                        
                        <MobileNavLink href={route('products.index')} active={route().current('products.*')} icon={<Package size={18}/>}>
                            Inventory
                        </MobileNavLink>

                        <MobileNavLink href={route('settings.warehouses.index')} active={route().current('settings.*')} icon={<Settings size={18}/>}>
                            Settings
                        </MobileNavLink>
                    </div>

                    <div className="pt-4 pb-4 border-t border-slate-100 px-4 bg-slate-50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-medium text-base text-slate-800">{user.name}</div>
                                <div className="font-medium text-sm text-slate-500">{user.email}</div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-2 px-3 py-2 text-base font-medium text-red-600 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <LogOut size={18} /> Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-16">
                {header && (
                    <header className="bg-white shadow-sm border-b border-slate-100">
                        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}
                <main>{children}</main>
            </div>
        </div>
    );
}

function NavLink({ href, active, children, icon }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 gap-2 ${
                active
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
        >
            {icon}
            {children}
        </Link>
    );
}

function MobileNavLink({ href, active, children, icon }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 w-full pl-3 pr-4 py-3 rounded-lg text-base font-medium transition duration-150 ease-in-out ${
                active
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-l-4 border-transparent'
            }`}
        >
            {icon}
            {children}
        </Link>
    );
}