import { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, Bell, LogOut, User, LayoutDashboard, Package, ChevronDown, ArrowDownLeft, ArrowUpRight, Settings, ArrowRightLeft, ClipboardList } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

export default function AuthenticatedLayout({ user, header, children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    
    // State untuk Dropdown Master Inventory
    const [showInventoryMenu, setShowInventoryMenu] = useState(false);
    const inventoryTimeoutRef = useRef(null);

    // --- LOGIC PERMISSION ---
    const { props } = usePage(); 
    
    // 1. Ambil Permissions dari Props Inertia
    const permissions = props.auth?.permissions || []; 

    // 2. Deteksi Role & Super Admin
    const userRoles = user.roles ? user.roles.map(r => r.name) : []; 
    if (user.role) userRoles.push(user.role); 
    
    // Cek Super Admin (Case Insensitive)
    const isSuperAdmin = userRoles.some(r => r.toLowerCase().includes('admin'));

    // 3. Helper Cek Izin (Bypass jika Super Admin)
    const hasPermission = (name) => {
        if (isSuperAdmin) return true; 
        return permissions.includes(name);
    };

    // --- DEFINISI AKSES MENU ---
    // Logika OR (||) digunakan agar support kedua jenis penamaan (dengan/tanpa prefix view_)
    
    const canViewDashboard = hasPermission('dashboard') || hasPermission('view_dashboard');
    
    // Transaksi Inbound & Outbound
    const canViewInbound = hasPermission('inbound') || hasPermission('view_inbound');
    const canViewOutbound = hasPermission('outbound') || hasPermission('view_outbound');
    
    // Master Inventory
    const canViewProducts = hasPermission('product') || hasPermission('view_product') || hasPermission('view_products');
    const canViewStockTransfers = hasPermission('transfer') || hasPermission('view_transfer') || hasPermission('view_transfers');
    const canViewStockOpname = hasPermission('stock_opname') || hasPermission('view_stock_opname');
    
    // Settings
    const canViewSettings = hasPermission('settings') || hasPermission('view_settings');

    // Group Logic: Inventory muncul jika salah satu anaknya boleh dilihat
    const canViewInventoryGroup = canViewProducts || canViewStockTransfers || canViewStockOpname;

    // --- FLASH MESSAGE LISTENER ---
    const flash = props.flash || {};

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
        }
        if (flash?.error) {
            toast.error(flash.error, { style: { borderRadius: '10px', background: '#ef4444', color: '#fff' } });
        }
    }, [flash]);
    
    // Logic Hover Dropdown
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
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 fixed w-full z-50 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="bg-indigo-600 p-1.5 rounded-lg">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-bold text-xl tracking-tight text-slate-800">WM<span className="text-indigo-600">Skd</span></span>
                            </Link>

                            {/* --- DESKTOP MENU --- */}
                            <div className="hidden sm:flex sm:space-x-4">
                                
                                {canViewDashboard && (
                                    <NavLink href={route('dashboard')} active={route().current('dashboard')} icon={<LayoutDashboard size={18}/>}>
                                        Dashboard
                                    </NavLink>
                                )}
                                
                                {canViewInbound && (
                                    <NavLink href={route('transactions.index', { type: 'inbound' })} active={route().current('transactions.index') && route().params.type === 'inbound'} icon={<ArrowDownLeft size={18}/>}>
                                        Inbound
                                    </NavLink>
                                )}

                                {canViewOutbound && (
                                    <NavLink href={route('transactions.index', { type: 'outbound' })} active={route().current('transactions.index') && route().params.type === 'outbound'} icon={<ArrowUpRight size={18}/>}>
                                        Outbound
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
                                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Package size={18} />
                                            Master Inventory
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${showInventoryMenu ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showInventoryMenu && (
                                            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    Manajemen Stok
                                                </div>
                                                
                                                {canViewProducts && (
                                                    <DropdownLink href={route('products.index')} active={route().current('products.*')}>
                                                        <Package size={16} /> Data Barang
                                                    </DropdownLink>
                                                )}
                                                
                                                {canViewStockTransfers && (
                                                    <DropdownLink href={route('stock-transfers.index')} active={route().current('stock-transfers.*')}>
                                                        <ArrowRightLeft size={16} /> Transfer Stok
                                                    </DropdownLink>
                                                )}
                                                
                                                {canViewStockOpname && (
                                                    <div className="px-4 py-2">
                                                        <button disabled className="flex items-center gap-3 w-full text-left text-sm font-medium text-slate-300 cursor-not-allowed">
                                                            <ClipboardList size={16} /> Stock Opname
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* --- SETTINGS --- */}
                                {canViewSettings && (
                                    <NavLink href={route('settings.warehouses.index')} active={route().current('settings.*')} icon={<Settings size={18}/>}>
                                        Settings
                                    </NavLink>
                                )}
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
                                        {/* Badge Role */}
                                        <div className="flex justify-end">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${isSuperAdmin ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                                {userRoles[0] || 'User'}
                                            </span>
                                        </div>
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
                            <button onClick={() => setShowingNavigationDropdown((previousState) => !previousState)} className="p-2 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none transition">
                                {showingNavigationDropdown ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- MOBILE MENU SLIDE --- */}
                <div className={`${showingNavigationDropdown ? 'block' : 'hidden'} sm:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl max-h-[80vh] overflow-y-auto`}>
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        
                        {canViewDashboard && (
                            <MobileNavLink href={route('dashboard')} active={route().current('dashboard')} icon={<LayoutDashboard size={18}/>}>
                                Dashboard
                            </MobileNavLink>
                        )}
                        
                        {canViewInbound && (
                            <MobileNavLink href={route('transactions.index', { type: 'inbound' })} active={route().current('transactions.index') && route().params.type === 'inbound'} icon={<ArrowDownLeft size={18}/>}>
                                Inbound
                            </MobileNavLink>
                        )}

                        {canViewOutbound && (
                            <MobileNavLink href={route('transactions.index', { type: 'outbound' })} active={route().current('transactions.index') && route().params.type === 'outbound'} icon={<ArrowUpRight size={18}/>}>
                                Outbound
                            </MobileNavLink>
                        )}
                        
                        {/* Mobile Inventory Group */}
                        {canViewInventoryGroup && (
                            <div className="py-2 border-t border-b border-slate-100 my-1">
                                <p className="px-3 text-xs font-bold text-slate-400 uppercase mb-1">Master Inventory</p>
                                
                                {canViewProducts && (
                                    <MobileNavLink href={route('products.index')} active={route().current('products.*')} icon={<Package size={18}/>}>
                                        Data Barang
                                    </MobileNavLink>
                                )}
                                
                                {canViewStockTransfers && (
                                    <MobileNavLink href={route('stock-transfers.index')} active={route().current('stock-transfers.*')} icon={<ArrowRightLeft size={18}/>}>
                                        Transfer Stok
                                    </MobileNavLink>
                                )}
                            </div>
                        )}

                        {canViewSettings && (
                            <MobileNavLink href={route('settings.warehouses.index')} active={route().current('settings.*')} icon={<Settings size={18}/>}>
                                Settings
                            </MobileNavLink>
                        )}
                    </div>

                    <div className="pt-4 pb-4 border-t border-slate-100 px-4 bg-slate-50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                            <div>
                                <div className="font-medium text-base text-slate-800">{user.name}</div>
                                <div className="font-medium text-xs text-slate-500 uppercase">{userRoles[0] || 'User'}</div>
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

// --- SUB COMPONENTS ---

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

function DropdownLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 w-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                    ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-2 border-transparent'
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
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-l-4 border-transparent'
            }`}
        >
            {icon}
            {children}
        </Link>
    );
}