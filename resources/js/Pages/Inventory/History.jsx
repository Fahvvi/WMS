import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    History, 
    ArrowDownLeft, 
    ArrowUpRight, 
    Calendar, 
    User, 
    MapPin, 
    ClipboardList, // Icon untuk Opname
    ArrowRightLeft // Icon untuk Transfer
} from 'lucide-react';

export default function ProductHistory({ auth, product, history }) {
    
    // Helper untuk menangani tampilan berdasarkan tipe transaksi
    const getTypeConfig = (type) => {
        switch (type) {
            case 'inbound':
                return {
                    icon: <ArrowDownLeft className="w-6 h-6" />,
                    bgIcon: 'bg-green-100 text-green-600',
                    badge: 'bg-green-50 text-green-700',
                    label: 'INBOUND',
                    textQty: 'text-green-600',
                    symbol: '+'
                };
            case 'outbound':
                return {
                    icon: <ArrowUpRight className="w-6 h-6" />,
                    bgIcon: 'bg-orange-100 text-orange-600',
                    badge: 'bg-orange-50 text-orange-700',
                    label: 'OUTBOUND',
                    textQty: 'text-orange-600',
                    symbol: '' // Minus sudah ada di data quantity
                };
            case 'transfer_in':
                return {
                    icon: <ArrowRightLeft className="w-6 h-6" />,
                    bgIcon: 'bg-blue-100 text-blue-600',
                    badge: 'bg-blue-50 text-blue-700',
                    label: 'TRANSFER MASUK',
                    textQty: 'text-blue-600',
                    symbol: '+'
                };
            case 'transfer_out':
                return {
                    icon: <ArrowRightLeft className="w-6 h-6" />,
                    bgIcon: 'bg-blue-50 text-blue-500',
                    badge: 'bg-blue-50 text-blue-600',
                    label: 'TRANSFER KELUAR',
                    textQty: 'text-blue-600',
                    symbol: ''
                };
            case 'stock_opname':
                return {
                    icon: <ClipboardList className="w-6 h-6" />,
                    bgIcon: 'bg-purple-100 text-purple-600',
                    badge: 'bg-purple-50 text-purple-700',
                    label: 'STOCK OPNAME',
                    textQty: 'text-purple-600',
                    symbol: (qty) => qty > 0 ? '+' : ''
                };
            default:
                return {
                    icon: <History className="w-6 h-6" />,
                    bgIcon: 'bg-slate-100 text-slate-600',
                    badge: 'bg-slate-50 text-slate-700',
                    label: type.toUpperCase(),
                    textQty: 'text-slate-600',
                    symbol: ''
                };
        }
    };

    // Handle jika history berupa array biasa atau pagination object
    const historyList = Array.isArray(history) ? history : (history?.data || []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('products.index')} className="p-2 bg-white rounded-full text-slate-500 hover:text-indigo-600 shadow-sm transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800 leading-tight flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-600" /> Riwayat Produk
                        </h2>
                        <p className="text-sm text-slate-500">{product.name} ({product.sku})</p>
                    </div>
                </div>
            }
        >
            <Head title={`History - ${product.name}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {historyList.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {historyList.map((log, index) => {
                                const config = getTypeConfig(log.type);
                                
                                return (
                                    <div key={log.id || index} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        
                                        {/* Bagian Kiri: Info Transaksi */}
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl shrink-0 ${config.bgIcon}`}>
                                                {config.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-mono font-bold text-slate-800 text-sm bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        {log.reference}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${config.badge}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {log.user}
                                                    </div>
                                                </div>
                                                {/* Catatan Tambahan */}
                                                {log.notes && log.notes !== '-' && (
                                                    <p className="text-xs text-slate-400 italic mt-1 bg-slate-50 inline-block px-2 py-1 rounded">
                                                        Catatan: {log.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bagian Kanan: Lokasi & Qty */}
                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 mb-1 flex items-center md:justify-end gap-1">
                                                    <MapPin className="w-3 h-3" /> Lokasi Gudang
                                                </p>
                                                <p className="font-bold text-slate-700">{log.warehouse}</p>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-xs text-slate-400 mb-1">Quantity</p>
                                                <p className={`text-xl font-bold ${config.textQty}`}>
                                                    {typeof config.symbol === 'function' ? config.symbol(log.quantity) : config.symbol}
                                                    {log.quantity}
                                                </p>
                                                <p className="text-[10px] text-slate-400 uppercase">{product.unit}</p>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            Belum ada riwayat transaksi untuk produk ini.
                        </div>
                    )}
                    
                    {/* Pagination (Hanya muncul jika backend mengirimkan object Pagination) */}
                    {history.links && (
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
                            <div className="flex gap-1 flex-wrap justify-center">
                                {history.links.map((link, k) => (
                                    link.url ? (
                                        <Link 
                                            key={k} 
                                            href={link.url} 
                                            className={`px-3 py-1 text-xs font-medium rounded border ${link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}