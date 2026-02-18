import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    History as HistoryIcon, // Alias untuk menghindari bentrok nama
    ArrowDownLeft, 
    ArrowUpRight, 
    Calendar, 
    User, 
    MapPin, 
    ClipboardList, // Icon untuk Opname
    ArrowRightLeft // Icon untuk Transfer
} from 'lucide-react';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function ProductHistory({ auth, product, history }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    
    // Helper untuk menangani tampilan berdasarkan tipe transaksi
    const getTypeConfig = (type) => {
        switch (type) {
            case 'inbound':
                return {
                    icon: <ArrowDownLeft className="w-6 h-6" />,
                    bgIcon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
                    label: t('INBOUND'),
                    textQty: 'text-emerald-600 dark:text-emerald-400',
                    symbol: '+'
                };
            case 'outbound':
                return {
                    icon: <ArrowUpRight className="w-6 h-6" />,
                    bgIcon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
                    badge: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50',
                    label: t('OUTBOUND'),
                    textQty: 'text-orange-600 dark:text-orange-400',
                    symbol: '' // Minus sudah ada di data quantity
                };
            case 'transfer_in':
                return {
                    icon: <ArrowRightLeft className="w-6 h-6" />,
                    bgIcon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50',
                    label: t('TRANSFER MASUK'),
                    textQty: 'text-blue-600 dark:text-blue-400',
                    symbol: '+'
                };
            case 'transfer_out':
                return {
                    icon: <ArrowRightLeft className="w-6 h-6" />,
                    bgIcon: 'bg-indigo-100 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400',
                    badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50',
                    label: t('TRANSFER KELUAR'),
                    textQty: 'text-indigo-600 dark:text-indigo-400',
                    symbol: ''
                };
            case 'stock_opname':
                return {
                    icon: <ClipboardList className="w-6 h-6" />,
                    bgIcon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50',
                    label: t('STOCK OPNAME'),
                    textQty: 'text-purple-600 dark:text-purple-400',
                    symbol: (qty) => qty > 0 ? '+' : ''
                };
            default:
                return {
                    icon: <HistoryIcon className="w-6 h-6" />,
                    bgIcon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                    badge: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    label: type ? type.toUpperCase() : t('UNKNOWN'),
                    textQty: 'text-slate-600 dark:text-slate-300',
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
                    <Link href={route('products.index')} className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-2">
                            <HistoryIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t('Riwayat Produk')}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{product.name} ({product.sku})</p>
                    </div>
                </div>
            }
        >
            <Head title={`${t('History')} - ${product.name}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                    {historyList.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {historyList.map((log, index) => {
                                const config = getTypeConfig(log.type);
                                
                                return (
                                    <div key={log.id || index} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        
                                        {/* Bagian Kiri: Info Transaksi */}
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl shrink-0 ${config.bgIcon}`}>
                                                {config.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                        {log.reference}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-transparent ${config.badge}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {log.user}
                                                    </div>
                                                </div>

                                                {/* --- MENAMPILKAN CATATAN --- */}
                                                {log.notes && (
                                                    <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-yellow-100 dark:border-yellow-800/50 italic flex items-start gap-1">
                                                        <span className="font-bold not-italic text-yellow-600 dark:text-yellow-500">{t('Catatan')}:</span> "{log.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bagian Kanan: Lokasi & Qty */}
                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-700/50 pt-3 md:pt-0">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 flex items-center md:justify-end gap-1">
                                                    <MapPin className="w-3 h-3" /> {t('Lokasi Gudang')}
                                                </p>
                                                <p className="font-bold text-slate-700 dark:text-slate-200">{log.warehouse}</p>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{t('Quantity')}</p>
                                                <p className={`text-xl font-bold ${config.textQty}`}>
                                                    {typeof config.symbol === 'function' ? config.symbol(log.quantity) : config.symbol}
                                                    {log.quantity}
                                                </p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">{product.unit}</p>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                            <HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            {t('Belum ada riwayat transaksi untuk produk ini.')}
                        </div>
                    )}
                    
                    {/* Pagination (Hanya muncul jika backend mengirimkan object Pagination) */}
                    {history.links && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-center">
                            <div className="flex gap-1 flex-wrap justify-center">
                                {history.links.map((link, k) => (
                                    link.url ? (
                                        <Link 
                                            key={k} 
                                            href={link.url} 
                                            className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                                                link.active 
                                                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' 
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
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