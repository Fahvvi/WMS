import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRightLeft, Plus, Search, Calendar, Package, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function StockTransferIndex({ auth, transfers }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    const [searchTerm, setSearchTerm] = useState('');
    
    // Ambil permission dari props (pastikan backend mengirim ini)
    const permissions = auth.permissions || [];
    const canApprove = permissions.includes('approve_transfers') || (auth.user.roles && auth.user.roles.some(r => r.name === 'Super Admin'));

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('stock-transfers.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    // Handle Approve
    const handleApprove = (id) => {
        Swal.fire({
            title: t('Setujui Transfer?'),
            text: t("Stok akan dipindahkan dari gudang asal ke tujuan."),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
            confirmButtonText: t('Ya, Setujui'),
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('stock-transfers.approve', id));
            }
        });
    };

    // Handle Reject
    const handleReject = (id) => {
        Swal.fire({
            title: t('Tolak Pengajuan?'),
            text: t("Pengajuan transfer akan dibatalkan."),
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: t('Ya, Tolak'),
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                router.put(route('stock-transfers.reject', id));
            }
        });
    };

    // Helper Badge Status
    const getStatusBadge = (status) => {
        switch(status) {
            case 'completed':
                return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-200 dark:border-green-800/50"><CheckCircle className="w-3 h-3" /> {t('Selesai')}</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-200 dark:border-red-800/50"><XCircle className="w-3 h-3" /> {t('Ditolak')}</span>;
            default: // pending
                return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/50 animate-pulse"><Clock className="w-3 h-3" /> {t('Menunggu Approval')}</span>;
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={t('Riwayat Transfer Stok')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <ArrowRightLeft className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> {t('Transfer Stok & Approval')}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                {t('Kelola pengajuan dan riwayat perpindahan barang.')}
                            </p>
                        </div>
                        
                        {/* Tombol Buat Transfer hanya jika punya izin create */}
                        {(permissions.includes('create_transfers') || (auth.user.roles && auth.user.roles.some(r => r.name === 'Super Admin'))) && (
                            <Link 
                                href={route('stock-transfers.create')}
                                className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 w-full md:w-auto"
                            >
                                <Plus className="w-5 h-5" /> {t('Transfer Baru')}
                            </Link>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                        
                        {/* SEARCH */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="relative max-w-md w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                                    placeholder={t('Cari nomor transfer...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearch}
                                />
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-x-auto min-h-[50vh]">
                            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">{t('No. Transfer')}</th>
                                        <th className="px-6 py-4 font-bold">{t('Rute Gudang')}</th>
                                        <th className="px-6 py-4 font-bold">{t('Item Detail')}</th>
                                        <th className="px-6 py-4 font-bold">{t('Pengaju')}</th>
                                        <th className="px-6 py-4 font-bold text-center">{t('Status')}</th>
                                        <th className="px-6 py-4 font-bold text-right">{t('Aksi')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {transfers.data.length > 0 ? (
                                        transfers.data.map((trf) => (
                                            <tr key={trf.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${trf.status === 'pending' ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                        {trf.transfer_number}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(trf.transfer_date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                                        <span className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 shadow-sm">{trf.from_warehouse?.code}</span>
                                                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                                                        <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800/50 shadow-sm">{trf.to_warehouse?.code}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[200px]">
                                                        {trf.from_warehouse?.name} → {trf.to_warehouse?.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">{trf.details_count} {t('Item')}</span>
                                                    </div>
                                                    {trf.notes && (
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1 max-w-[150px] truncate">
                                                            "{trf.notes}"
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                            {trf.user?.name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">{trf.user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    {getStatusBadge(trf.status)}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    {/* TOMBOL AKSI: Hanya Muncul Jika Pending & Punya Izin Approve */}
                                                    {trf.status === 'pending' && canApprove ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => handleApprove(trf.id)}
                                                                className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition border border-green-200 dark:border-green-800/50"
                                                                title={t('Setujui (Approve)')}
                                                            >
                                                                <CheckCircle className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReject(trf.id)}
                                                                className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition border border-red-200 dark:border-red-800/50"
                                                                title={t('Tolak (Reject)')}
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-300 dark:text-slate-600 italic">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">{t('Belum ada riwayat transfer.')}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        {transfers.links && transfers.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex gap-1 flex-wrap justify-center">
                                    {transfers.links.map((link, i) => (
                                        link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                                                    link.active 
                                                    ? 'bg-indigo-600 text-white font-bold border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' 
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 text-xs rounded-lg text-slate-300 dark:text-slate-600 cursor-not-allowed border border-transparent"
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