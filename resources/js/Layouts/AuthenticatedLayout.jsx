import { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, Bell, LogOut, User, LayoutDashboard, Package, ChevronDown, ArrowDownLeft, ArrowUpRight, Settings, ArrowRightLeft, ClipboardList } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N DI SINI

export default function AuthenticatedLayout({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    
    // State untuk Dropdown Master Inventory
    const [showInventoryMenu, setShowInventoryMenu] = useState(false);
    const inventoryTimeoutRef = useRef(null);

    const { props } = usePage(); 
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI FUNGSI TRANSLATE

    // --- LOGIKA DARK MODE TEMA ---
    useEffect(() => {
        const theme = user.theme;
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            // System
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [user.theme]);
    
    // --- 1. AMBIL PERMISSION & ROLE ---
    const permissions = props.auth?.permissions || []; 

    const userRoles = user.roles ? user.roles.map(r => r.name) : []; 
    if (user.role) userRoles.push(user.role); 
    
    const isSuperAdmin = userRoles.some(r => r.toLowerCase().includes('admin'));

    // --- 2. HELPER CEK IZIN ---
    const hasPermission = (name) => {
        if (isSuperAdmin) return true;
        return permissions.includes(name);
    };

    // --- 3. DEFINISI AKSES MENU ---
    const canViewDashboard = hasPermission('dashboard') || hasPermission('view_dashboard');
    const canViewInbound = hasPermission('inbound') || hasPermission('view_inbound');
    const canViewOutbound = hasPermission('outbound') || hasPermission('view_outbound');
    const canViewProducts = hasPermission('product') || hasPermission('view_product') || hasPermission('view_products');
    const canViewStockTransfers = hasPermission('transfer') || hasPermission('view_transfer') || hasPermission('view_transfers');
    const canViewStockOpname = hasPermission('stock_opname') || hasPermission('view_stock_opname');
    const canViewSettings = hasPermission('settings') || hasPermission('view_settings');
    const canViewInventoryGroup = canViewProducts || canViewStockTransfers || canViewStockOpname;

    // --- FLASH MESSAGE ---
    const flash = props.flash || {};

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
        }
        if (flash?.error) {
            toast.error(flash.error, { style: { borderRadius: '10px', background: '#ef4444', color: '#fff' } });
        }
    }, [flash]);
    
    const handleMouseEnter = () => {
        if (inventoryTimeoutRef.current) clearTimeout(inventoryTimeoutRef.current);
        setShowInventoryMenu(true);
    };

    const handleMouseLeave = () => {
        inventoryTimeoutRef.current = setTimeout(() => {
            setShowInventoryMenu(false);
        }, 200);
    };


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Pembungkus Utama dengan background dark mode */}
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

            {/* Navbar dengan warna dark mode */}
            <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 fixed w-full z-50 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="bg-indigo-600 p-1.5 rounded-lg">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">WM<span className="text-indigo-600 dark:text-indigo-400">Skd</span></span>
                            </Link>

                            {/* --- DESKTOP MENU --- */}
                            <div className="hidden sm:flex sm:space-x-4">
                                
                                {canViewDashboard && (
                                    <NavLink href={route('dashboard')} active={route().current('dashboard')} icon={<LayoutDashboard size={18}/>}>
                                        {t('Dashboard')}
                                    </NavLink>
                                )}
                                
                                {canViewInbound && (
                                    <NavLink href={route('transactions.index', { type: 'inbound' })} active={route().current('transactions.index') && route().params.type === 'inbound'} icon={<ArrowDownLeft size={18}/>}>
                                        {t('Inbound')}
                                    </NavLink>
                                )}

                                {canViewOutbound && (
                                    <NavLink href={route('transactions.index', { type: 'outbound' })} active={route().current('transactions.index') && route().params.type === 'outbound'} icon={<ArrowUpRight size={18}/>}>
                                        {t('Outbound')}
                                    </NavLink>
                                )}
                                
                                {/* --- GROUP: MASTER INVENTORY --- */}
                                {canViewInventoryGroup && (
                                    <div 
                                        className="relative flex items-center"
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <button 
                                            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 gap-2 ${
                                                route().current('products.*') || route().current('stock-transfers.*')
                                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <Package size={18} />
                                            {t('Master Inventory')}
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${showInventoryMenu ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showInventoryMenu && (
                                            <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                    {t('Manajemen Stok')}
                                                </div>
                                                
                                                {canViewProducts && (
                                                    <DropdownLink href={route('products.index')} active={route().current('products.*')}>
                                                        <Package size={16} /> {t('Data Barang')}
                                                    </DropdownLink>
                                                )}
                                                
                                                {canViewStockTransfers && (
                                                    <DropdownLink href={route('stock-transfers.index')} active={route().current('stock-transfers.*')}>
                                                        <ArrowRightLeft size={16} /> {t('Transfer Stok')}
                                                    </DropdownLink>
                                                )}
                                                
                                                {canViewStockOpname && (
                                                    <DropdownLink href={route('stock-opnames.index')} active={route().current('stock-opname.*')}>
                                                        <ClipboardList size={16} /> {t('Stock Opname')}
                                                    </DropdownLink>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* --- SETTINGS --- */}
                                {canViewSettings && (
                                   <NavLink 
                                        href={route('settings.index')} 
                                        active={route().current('settings.*')}
                                        icon={<Settings size={18} />}
                                    >
                                        {t('Settings')}
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        {/* --- BAGIAN KANAN (PROFILE) --- */}
                        <div className="hidden sm:flex sm:items-center sm:gap-4">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 rounded-full transition relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                            </button>

                            <div className="relative ml-3">
                                <button 
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-3 focus:outline-none"
                                >
                                    <div className="text-right hidden md:block">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.name}</div>
                                        {/* Badge Role */}
                                        <div className="flex justify-end">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${isSuperAdmin ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'}`}>
                                                {userRoles[0] || 'User'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                                        {user.name.charAt(0)}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition ${showProfileMenu ? 'rotate-180' : ''}`}/>
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 origin-top-right ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                        <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('Signed in as')}</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.email}</p>
                                        </div>
                                        <Link href={route('profile.edit')} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <User size={16} /> {t('Profile')}
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left">
                                            <LogOut size={16} /> {t('Log Out')}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="-mr-2 flex items-center sm:hidden">
                            <button onClick={() => setShowingNavigationDropdown((previousState) => !previousState)} className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition">
                                {showingNavigationDropdown ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- MOBILE MENU SLIDE --- */}
                <div className={`${showingNavigationDropdown ? 'block' : 'hidden'} sm:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 absolute w-full shadow-xl max-h-[80vh] overflow-y-auto`}>
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        
                        {canViewDashboard && (
                            <MobileNavLink href={route('dashboard')} active={route().current('dashboard')} icon={<LayoutDashboard size={18}/>}>
                                {t('Dashboard')}
                            </MobileNavLink>
                        )}
                        
                        {canViewInbound && (
                            <MobileNavLink href={route('transactions.index', { type: 'inbound' })} active={route().current('transactions.index') && route().params.type === 'inbound'} icon={<ArrowDownLeft size={18}/>}>
                                {t('Inbound')}
                            </MobileNavLink>
                        )}

                        {canViewOutbound && (
                            <MobileNavLink href={route('transactions.index', { type: 'outbound' })} active={route().current('transactions.index') && route().params.type === 'outbound'} icon={<ArrowUpRight size={18}/>}>
                                {t('Outbound')}
                            </MobileNavLink>
                        )}
                        
                        {/* Mobile Inventory Group */}
                        {canViewInventoryGroup && (
                            <div className="py-2 border-t border-b border-slate-100 dark:border-slate-800 my-1">
                                <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{t('Master Inventory')}</p>
                                
                                {canViewProducts && (
                                    <MobileNavLink href={route('products.index')} active={route().current('products.*')} icon={<Package size={18}/>}>
                                        {t('Data Barang')}
                                    </MobileNavLink>
                                )}
                                
                                {canViewStockTransfers && (
                                    <MobileNavLink href={route('stock-transfers.index')} active={route().current('stock-transfers.*')} icon={<ArrowRightLeft size={18}/>}>
                                        {t('Transfer Stok')}
                                    </MobileNavLink>
                                )}
                                {canViewStockOpname && (
                                    <MobileNavLink href={route('stock-opnames.index')} active={route().current('stock-opname.*')} icon={<ClipboardList size={18}/>}>
                                        {t('Stock Opname')}
                                    </MobileNavLink>
                                )}
                            </div>
                        )}

                        {canViewSettings && (
                            <MobileNavLink href={route('settings.index')} active={route().current('settings.*')} icon={<Settings size={18}/>}>
                                {t('Settings')}
                            </MobileNavLink>
                        )}
                    </div>

                    <div className="pt-4 pb-4 border-t border-slate-100 dark:border-slate-800 px-4 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                            <div>
                                <div className="font-medium text-base text-slate-800 dark:text-slate-200">{user.name}</div>
                                <div className="font-medium text-xs text-slate-500 dark:text-slate-400 uppercase">{userRoles[0] || 'User'}</div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-2 px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <LogOut size={18} /> {t('Log Out')}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-16">
                {header && (
                    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800 transition-colors duration-200">
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

// --- SUB COMPONENTS DENGAN DARK MODE ---

function NavLink({ href, active, children, icon }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 gap-2 ${
                active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
            }`}
        >
            {icon}
            {children}
        </Link>
    );
}

function DropdownLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 w-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-400'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-2 border-transparent dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
            }`}
        >
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
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-400'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-l-4 border-transparent dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
            }`}
        >
            {icon}
            {children}
        </Link>
    );
}