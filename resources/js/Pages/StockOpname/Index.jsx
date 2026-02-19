import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, Plus, Search, Eye, MapPin, Calendar, FileText } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce'; // Pastikan install: npm install use-debounce
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function StockOpnameIndex({ auth, opnames, filters }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    
    // State untuk Search
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(searchTerm, 500); // Delay 500ms sebelum request

    // Effect: Jalankan search saat user selesai mengetik
    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            router.get(
                route('stock-opnames.index'),
                { search: debouncedSearch },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 leading-tight transition-colors">{t('Riwayat Stock Opname')}</h2>}
        >
            <Head title={t('Stock Opname')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm sm:rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors">
                        
                        {/* Header & Toolbar */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                            
                            {/* Search Box */}
                            <div className="relative w-full md:w-96 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <TextInput 
                                    className="block w-full h-10 pl-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 transition-colors shadow-sm placeholder:text-slate-400" 
                                    placeholder={t('Cari nomor opname...')} 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Tombol Tambah */}
                            <Link
                                href={route('stock-opnames.create')}
                                className="w-full md:w-auto h-10 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-6 rounded-xl font-bold shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Plus className="w-5 h-5" /> {t('Buat Opname Baru')}
                            </Link>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto min-h-[50vh]">
                            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">{t('Nomor Dokumen')}</th>
                                        <th className="px-6 py-4 font-bold">{t('Lokasi Gudang')}</th>
                                        <th className="px-6 py-4 font-bold">{t('Petugas')}</th>
                                        <th className="px-6 py-4 font-bold">{t('Total Item')}</th>
                                        <th className="px-6 py-4 font-bold">{t('Status')}</th>
                                        <th className="px-6 py-4 text-right font-bold">{t('Aksi')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {opnames.data.length > 0 ? (
                                        opnames.data.map((so) => (
                                            <tr key={so.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-base">
                                                        {so.opname_number}
                                                    </div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3" /> 
                                                        {new Date(so.opname_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                                            <MapPin className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium text-slate-700 dark:text-slate-200">{so.warehouse?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                            {so.user?.name.charAt(0)}
                                                        </div>
                                                        <span className="text-slate-700 dark:text-slate-300">{so.user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                                                        {so.details_count} {t('Item')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-800/50 flex w-fit items-center gap-1 shadow-sm">
                                                        <ClipboardList className="w-3 h-3" /> {t('Selesai')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <Link 
                                                        href={route('stock-opnames.show', so.id)}
                                                        className="inline-flex p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                        title={t('Lihat Detail')}
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                                    <p className="font-medium text-slate-600 dark:text-slate-400">{t('Belum ada data Stock Opname.')}</p>
                                                    <p className="text-xs mt-1">{t('Data akan muncul setelah Anda melakukan opname.')}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {opnames.links && opnames.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 flex justify-center">
                                <div className="flex gap-1 flex-wrap justify-center">
                                    {opnames.links.map((link, i) => (
                                        link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium border ${
                                                    link.active 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500 shadow-sm' 
                                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 text-sm rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed border border-transparent"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}