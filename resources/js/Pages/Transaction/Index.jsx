import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    ArrowDownLeft, ArrowUpRight, Search, Plus, 
    Calendar, MapPin, User, Package, Tag, Clock
} from 'lucide-react';
import { useLaravelReactI18n } from 'laravel-react-i18n';

export default function TransactionIndex({ auth, transactions, type, filters }) {
    const { t } = useLaravelReactI18n();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    
    const isInbound = type === 'inbound';
    const pageTitle = isInbound ? t('Data Inbound (Masuk)') : t('Data Outbound (Keluar)');

    // Handle Search
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('transactions.index', { type }), { search: searchTerm }, { preserveState: true });
        }
    };

    // Helper: Ambil Kategori Unik dari Detail Transaksi
    const getCategories = (details) => {
        if (!details || details.length === 0) return '-';
        // Ambil kategori unik saja
        const categories = [...new Set(details.map(d => d.product?.category || t('Umum')))];
        return categories.join(', ');
    };

    // Helper: Format Tanggal & Waktu
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            hour12: false
        }).format(date).replace('.', ':');
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="font-bold text-xl text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-2">
                        {isInbound ? <ArrowDownLeft className="text-indigo-600 dark:text-indigo-400"/> : <ArrowUpRight className="text-orange-600 dark:text-orange-400"/>}
                        {pageTitle}
                    </h2>
                    <Link 
                        href={route('transactions.create', { type })}
                        className={`px-4 py-2 h-10 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 text-sm transition-colors ${isInbound ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600' : 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600'}`}
                    >
                        <Plus className="w-4 h-4" /> {t('Buat Transaksi')}
                    </Link>
                </div>
            }
        >
            <Head title={pageTitle} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-[100%] mx-auto">
                
                {/* Search Bar */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-t-2xl border border-slate-200 dark:border-slate-700 border-b-0 flex justify-between items-center transition-colors">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            className="w-full h-10 pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                            placeholder={t('Cari No. Transaksi...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* TABLE GRID */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm rounded-b-2xl transition-colors min-h-[50vh]">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-bold">{t('No. Transaksi')}</th>
                                <th className="px-6 py-4 font-bold">{t('Tanggal & Waktu')}</th>
                                <th className="px-6 py-4 font-bold">{t('Gudang')}</th>
                                <th className="px-6 py-4 font-bold">{t('User Input')}</th>
                                <th className="px-6 py-4 font-bold text-center">{isInbound ? t('Qty Masuk') : t('Qty Keluar')}</th>
                                <th className="px-6 py-4 font-bold">{t('Kategori')}</th>
                                <th className="px-6 py-4 font-bold text-center">{t('Status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {transactions.data.length > 0 ? (
                                transactions.data.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-colors group">
                                        
                                        {/* 1. No Transaksi (SUDAH DIPERBAIKI: Link dihilangkan agar tidak Error Ziggy) */}
                                        <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                            <span className="text-indigo-600 dark:text-indigo-400">
                                                {trx.trx_number}
                                            </span>
                                        </td>

                                        {/* 2. Tanggal & Waktu */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                <span className="font-medium">
                                                    {formatDateTime(trx.created_at)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 3. Gudang */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span className="truncate max-w-[150px]">{trx.warehouse?.name || '-'}</span>
                                            </div>
                                        </td>

                                        {/* 4. User Input */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-white dark:border-slate-600 shadow-sm shrink-0">
                                                    {trx.user?.name.charAt(0)}
                                                </div>
                                                <span className="font-medium truncate max-w-[120px]">{trx.user?.name}</span>
                                            </div>
                                        </td>

                                        {/* 5. Qty Inbound / Outbound */}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
                                                isInbound 
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50' 
                                                : 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50'
                                            }`}>
                                                {trx.details_sum_quantity || 0} {t('Item')}
                                            </span>
                                        </td>

                                        {/* 6. Category */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-2 max-w-[150px]">
                                                    {getCategories(trx.details)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 7. Status */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                                                {t(trx.status || 'Completed')}
                                            </span>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                                        <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        {t('Belum ada data transaksi.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {transactions.links && transactions.data.length > 0 && (
                    <div className="mt-6 flex justify-end gap-1">
                        {transactions.links.map((link, k) => (
                            link.url ? (
                                <Link 
                                    key={k} 
                                    href={link.url}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                        link.active 
                                        ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500' 
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : null
                        ))}
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}