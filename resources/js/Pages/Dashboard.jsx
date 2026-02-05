import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    LayoutDashboard, ArrowDownLeft, ArrowUpRight, 
    Package, Users, Clock, AlertTriangle, TrendingUp 
} from 'lucide-react';

export default function Dashboard({ auth, stats, recent_inbound, recent_outbound, users }) {
    
    // Komponen Kartu Ringkasan Kecil
    const StatCard = ({ title, value, icon, color, subtext }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{title}</p>
                <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
                {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
            </div>
        </div>
    );

    // Komponen Baris Tabel Transaksi
    const TransactionRow = ({ trx, type }) => (
        <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${type === 'inbound' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                    {type === 'inbound' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                    <p className="font-bold text-slate-700 text-sm">{trx.trx_number}</p>
                    <p className="text-xs text-slate-500">{new Date(trx.trx_date).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-slate-800 text-sm">
                    {trx.details.reduce((acc, item) => acc + item.quantity, 0)} Items
                </p>
                <p className="text-xs text-slate-400">Oleh: {trx.user?.name}</p>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-bold text-xl text-slate-800 flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-indigo-600"/> Dashboard Overview</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
                
                {/* --- 1. STATS CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Produk" 
                        value={stats.total_products} 
                        icon={<Package size={24} />} 
                        color="bg-blue-100 text-blue-600"
                        subtext="Master Data SKU"
                    />
                    <StatCard 
                        title="Total Stok Fisik" 
                        value={stats.total_stock} 
                        icon={<TrendingUp size={24} />} 
                        color="bg-emerald-100 text-emerald-600"
                        subtext="Unit di semua gudang"
                    />
                    <StatCard 
                        title="Inbound Terbaru" 
                        value={recent_inbound.length} 
                        icon={<ArrowDownLeft size={24} />} 
                        color="bg-indigo-100 text-indigo-600"
                        subtext="5 Transaksi terakhir"
                    />
                    <StatCard 
                        title="User Aktif" 
                        value={users.length} 
                        icon={<Users size={24} />} 
                        color="bg-purple-100 text-purple-600"
                        subtext="User terdaftar"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- 2. GRAFIK & DATA INBOUND (KOLOM KIRI - LEBAR 2) --- */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Panel Inbound */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <ArrowDownLeft className="w-5 h-5 text-indigo-600" /> Inbound Terbaru (Masuk)
                                </h3>
                                <span className="text-xs font-bold bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-100">Top 5</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {recent_inbound.length > 0 ? (
                                    recent_inbound.map(trx => <TransactionRow key={trx.id} trx={trx} type="inbound" />)
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">Belum ada data inbound.</div>
                                )}
                            </div>
                        </div>

                        {/* Panel Outbound */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-orange-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <ArrowUpRight className="w-5 h-5 text-orange-600" /> Outbound Terbaru (Keluar)
                                </h3>
                                <span className="text-xs font-bold bg-white text-orange-600 px-2 py-1 rounded border border-orange-100">Top 5</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {recent_outbound.length > 0 ? (
                                    recent_outbound.map(trx => <TransactionRow key={trx.id} trx={trx} type="outbound" />)
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">Belum ada data outbound.</div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* --- 3. SIDEBAR KANAN (USER & HISTORY) --- */}
                    <div className="space-y-8">
                        
                        {/* User Widget */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-slate-400" /> User Team
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {users.map(u => (
                                    <div key={u.id} className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-white shadow-sm">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{u.name}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                <p className="text-xs text-slate-400">Active</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity Widget (Simulasi Log) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-400" /> Aktivitas Terakhir
                                </h3>
                            </div>
                            <div className="p-4">
                                <div className="border-l-2 border-slate-200 ml-2 space-y-6">
                                    {/* Kita gabungkan inbound & outbound jadi satu list log sederhana */}
                                    {[...recent_inbound, ...recent_outbound]
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .slice(0, 5)
                                        .map((log, idx) => (
                                        <div key={idx} className="relative pl-6">
                                            <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${log.type === 'inbound' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                                            <p className="text-xs text-slate-400 mb-0.5">{new Date(log.created_at).toLocaleTimeString()}</p>
                                            <p className="text-sm font-medium text-slate-700">
                                                <span className="font-bold text-slate-900">{log.user?.name}</span> melakukan {log.type === 'inbound' ? 'penerimaan' : 'pengiriman'} barang <span className="font-mono text-xs bg-slate-100 px-1 rounded">{log.trx_number}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}