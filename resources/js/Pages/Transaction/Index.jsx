import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    ArrowDownLeft, ArrowUpRight, Search, Plus, 
    Calendar, MapPin, User, Package, Tag, Clock
} from 'lucide-react';

export default function TransactionIndex({ auth, transactions, type, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    
    const isInbound = type === 'inbound';
    const pageTitle = isInbound ? 'Data Inbound (Masuk)' : 'Data Outbound (Keluar)';

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
        const categories = [...new Set(details.map(d => d.product?.category || 'Umum'))];
        return categories.join(', ');
    };

    // Helper: Format Tanggal & Waktu (Indonesia)
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            hour12: false
        }).format(date).replace('.', ':'); // Ganti pemisah waktu jadi titik dua (opsional)
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="font-bold text-xl text-slate-800 leading-tight flex items-center gap-2">
                        {isInbound ? <ArrowDownLeft className="text-indigo-600"/> : <ArrowUpRight className="text-orange-600"/>}
                        {pageTitle}
                    </h2>
                    <Link 
                        href={route('transactions.create', { type })}
                        className={`px-4 py-2 text-white font-bold rounded-lg shadow-md flex items-center gap-2 text-sm transition ${isInbound ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                    >
                        <Plus className="w-4 h-4" /> Buat Transaksi
                    </Link>
                </div>
            }
        >
            <Head title={pageTitle} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-[100%] mx-auto">
                
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Cari No. Transaksi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                </div>

                {/* TABLE GRID */}
                <div className="bg-white border border-slate-200 overflow-x-auto shadow-sm rounded-b-xl">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                {/* URUTAN KOLOM SESUAI REQUEST */}
                                <th className="px-6 py-3 font-bold">No. Transaksi</th>
                                <th className="px-6 py-3 font-bold">Tanggal & Waktu</th>
                                <th className="px-6 py-3 font-bold">Gudang</th>
                                <th className="px-6 py-3 font-bold">User Input</th>
                                <th className="px-6 py-3 font-bold text-center">Qty {isInbound ? 'Masuk' : 'Keluar'}</th>
                                <th className="px-6 py-3 font-bold">Category</th>
                                <th className="px-6 py-3 font-bold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.data.length > 0 ? (
                                transactions.data.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50 transition">
                                        
                                        {/* 1. No Transaksi */}
                                        <td className="px-6 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                                            {trx.trx_number}
                                        </td>

                                        {/* 2. Tanggal & Waktu */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium">
                                                    {formatDateTime(trx.created_at)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 3. Gudang */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <span>{trx.warehouse?.name || '-'}</span>
                                            </div>
                                        </td>

                                        {/* 4. User Input */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm">
                                                    {trx.user?.name.charAt(0)}
                                                </div>
                                                <span className="font-medium">{trx.user?.name}</span>
                                            </div>
                                        </td>

                                        {/* 5. Qty Inbound (Qty Transaksi SAJA) */}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isInbound ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                                {/* Ini memanggil details_sum_quantity dari Controller */}
                                                {trx.details_sum_quantity || 0} Item
                                            </span>
                                        </td>

                                        {/* 6. Category */}
                                        <td className="px-6 py-4 max-w-xs truncate">
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-medium text-slate-600 truncate">
                                                    {getCategories(trx.details)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* 7. Status */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-lg border border-green-200">
                                                {trx.status}
                                            </span>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        Belum ada data transaksi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex justify-end gap-1">
                    {transactions.links.map((link, k) => (
                        link.url ? (
                            <Link 
                                key={k} 
                                href={link.url}
                                className={`px-3 py-1 text-xs font-medium rounded border ${
                                    link.active 
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : null
                    ))}
                </div>

            </div>
        </AuthenticatedLayout>
    );
}