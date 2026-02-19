import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    LayoutDashboard, ArrowDownLeft, ArrowUpRight, 
    Package, Users, Clock, TrendingUp, History, UserX
} from 'lucide-react';
import { useLaravelReactI18n } from 'laravel-react-i18n';

export default function Dashboard({ auth, stats, recent_inbound, recent_outbound, users }) {
    const { t } = useLaravelReactI18n();

    // Cek Role Admin
    const userRoles = auth.user.roles ? auth.user.roles.map(r => r.name.toLowerCase()) : [];
    if (auth.user.role) userRoles.push(auth.user.role.toLowerCase());
    const isAdmin = userRoles.some(r => r.includes('admin'));

    // Filter Aktivitas User
    const allActivities = [...recent_inbound, ...recent_outbound]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
    const displayActivities = isAdmin 
        ? allActivities.slice(0, 10) 
        : allActivities.filter(log => log.user_id === auth.user.id).slice(0, 5);

    // --- HELPER STATUS USER ---
    const getUserStatus = (lastLoginAt) => {
        if (!lastLoginAt) {
            return { label: t('Belum pernah login'), color: 'bg-slate-200 text-slate-500', active: false };
        }

        const lastLogin = new Date(lastLoginAt);
        const now = new Date();
        const diffInMinutes = (now - lastLogin) / 1000 / 60;

        // Anggap Active jika login dalam 120 menit terakhir (2 jam)
        if (diffInMinutes < 120) {
            return { label: 'Active', color: 'bg-green-500', active: true };
        }

        // Format tanggal jika sudah lama
        const formattedDate = lastLogin.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const formattedTime = lastLogin.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        return { 
            label: `${t('Last active')}: ${formattedDate}, ${formattedTime}`, 
            color: 'bg-slate-400', 
            active: false 
        };
    };

    // Komponen StatCard
    const StatCard = ({ title, value, icon, color, subtext }) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
                <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</h4>
                {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>}
            </div>
        </div>
    );

    // Komponen Baris Transaksi
    const TransactionRow = ({ trx, type }) => (
        <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 group">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                    type === 'inbound' 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                        : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                }`}>
                    {type === 'inbound' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
               <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {trx.trx_number}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(trx.trx_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {trx.details ? trx.details.reduce((acc, item) => acc + item.quantity, 0) : 0} {t('Items')}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('Oleh')}: {trx.user?.name}</p>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-bold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors"><LayoutDashboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/> {t('Dashboard Overview')}</h2>}
        >
            <Head title={t('Dashboard')} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-[95%] mx-auto space-y-8">
                
                {/* 1. STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title={t('Total Produk')} value={stats.total_products} 
                        icon={<Package size={24} />} 
                        color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        subtext={t('Master Data SKU')}
                    />
                    <StatCard 
                        title={t('Total Stok Fisik')} value={stats.total_stock} 
                        icon={<TrendingUp size={24} />} 
                        color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        subtext={t('Unit di semua gudang')}
                    />
                    <StatCard 
                        title={t('Transaksi Terakhir')} value={recent_inbound.length + recent_outbound.length} 
                        icon={<History size={24} />} 
                        color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        subtext={t('Total Inbound & Outbound baru')}
                    />
                    {isAdmin && (
                        <StatCard 
                            title={t('User Aktif')} value={users.length} 
                            icon={<Users size={24} />} 
                            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                            subtext={t('User terdaftar')}
                        />
                    )}
                </div>

                {/* LAYOUT GRID */}
                <div className={`grid grid-cols-1 gap-8 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
                    
                    {/* KONTEN KIRI (Transaksi) */}
                    <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} space-y-8`}>
                        
                        {/* JIKA ADMIN: Panel Inbound Lebar (Scrollable jika banyak) */}
                        {isAdmin && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-indigo-50/50 dark:bg-slate-800/80">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <ArrowDownLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t('Seluruh Inbound Terbaru (Masuk)')}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('Memonitor penerimaan barang secara keseluruhan.')}</p>
                                    </div>
                                    <Link href={route('transactions.index', { type: 'inbound' })} className="text-xs font-bold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50 transition">
                                        {t('Lihat Semua')}
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {recent_inbound.length > 0 ? (
                                        recent_inbound.map(trx => <TransactionRow key={trx.id} trx={trx} type="inbound" />)
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">{t('Belum ada data inbound.')}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PANEL OUTBOUND */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-orange-50/50 dark:bg-slate-800/80">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <ArrowUpRight className="w-5 h-5 text-orange-600 dark:text-orange-400" /> {t('Outbound Terbaru (Keluar)')}
                                </h3>
                                {!isAdmin && <span className="text-xs font-bold bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 px-2 py-1 rounded border border-orange-100 dark:border-orange-800/50">Top 5</span>}
                                {isAdmin && (
                                     <Link href={route('transactions.index', { type: 'outbound' })} className="text-xs font-bold bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-800/50 transition">
                                        {t('Lihat Semua')}
                                    </Link>
                                )}
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {recent_outbound.length > 0 ? (
                                    recent_outbound.slice(0, 5).map(trx => <TransactionRow key={trx.id} trx={trx} type="outbound" />)
                                ) : (
                                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">{t('Belum ada data outbound.')}</div>
                                )}
                            </div>
                        </div>

                        {/* PANEL INBOUND (Khusus User Biasa) */}
                        {!isAdmin && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-indigo-50/50 dark:bg-slate-800/80">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <ArrowDownLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t('Inbound Terbaru')}
                                    </h3>
                                    <span className="text-xs font-bold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800/50">Top 5</span>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {recent_inbound.length > 0 ? (
                                        recent_inbound.slice(0, 5).map(trx => <TransactionRow key={trx.id} trx={trx} type="inbound" />)
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">{t('Belum ada data inbound.')}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- KONTEN KANAN (User & Aktivitas) --- */}
                    <div className="space-y-8 lg:col-span-1">
                        
                        {/* User Widget (Hanya Admin) */}
                        {isAdmin && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" /> {t('User Team')}
                                    </h3>
                                </div>
                                <div className="p-4 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                                    {users.map(u => {
                                        const status = getUserStatus(u.last_login_at);
                                        return (
                                            <div key={u.id} className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold border border-white dark:border-slate-600 shadow-sm shrink-0">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div className="overflow-hidden w-full">
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{u.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                                                            {status.label}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity Widget */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" /> 
                                    {isAdmin ? t('Aktivitas Terakhir (Semua)') : t('Aktivitas Anda')}
                                </h3>
                            </div>
                            <div className="p-5">
                                <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-6">
                                    {displayActivities.length > 0 ? (
                                        displayActivities.map((log, idx) => (
                                            <div key={idx} className="relative pl-6">
                                                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-800 ${log.type === 'inbound' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                                                    {new Date(log.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
                                                </p>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {isAdmin && <span className="font-bold text-slate-900 dark:text-white mr-1">{log.user?.name}</span>}
                                                    {t('melakukan')} {log.type === 'inbound' ? <span className="text-indigo-600 dark:text-indigo-400">{t('penerimaan')}</span> : <span className="text-orange-600 dark:text-orange-400">{t('pengeluaran')}</span>} {t('barang')} <span className="font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 ml-1">{log.trx_number}</span>
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="pl-4 text-sm text-slate-400 dark:text-slate-500 italic">{t('Belum ada aktivitas tercatat.')}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}