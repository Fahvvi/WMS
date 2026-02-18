import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { History, Activity, ShieldAlert, CheckCircle2, XCircle, Search, Filter, Calendar, X, Download, Plus} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce'; // Pastikan install: npm install use-debounce

export default function BusinessLog({ auth, logs, filters, availableMenus }) {
    
    // --- STATE UNTUK FILTER ---
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [menuFilter, setMenuFilter] = useState(filters?.menu || '');
    const [dateFilter, setDateFilter] = useState(filters?.date || '');

    // Debounce khusus untuk pencarian teks agar tidak memberatkan server saat mengetik
    const [debouncedSearch] = useDebounce(searchQuery, 500);

    // Effect untuk trigger pencarian setiap kali nilai filter berubah
    useEffect(() => {
        // Jangan trigger request pertama kali jika tidak ada filter yang berubah
        if (
            debouncedSearch === (filters?.search || '') &&
            menuFilter === (filters?.menu || '') &&
            dateFilter === (filters?.date || '')
        ) {
            return;
        }

        router.get(
            route('settings.business-log'),
            { search: debouncedSearch, menu: menuFilter, date: dateFilter },
            { preserveState: true, replace: true }
        );
    }, [debouncedSearch, menuFilter, dateFilter]);

    // Fungsi reset filter
    const resetFilters = () => {
        setSearchQuery('');
        setMenuFilter('');
        setDateFilter('');
        router.get(route('settings.business-log'));
    };

    // --- HELPER FORMATTING ---
    const formatMenu = (subjectType) => {
        if(!subjectType) return 'Sistem';
        const modelName = subjectType.split('\\').pop();
        return availableMenus[modelName] || modelName;
    };

    const formatOperation = (event) => {
        const operations = {
            created: { label: 'Create', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            updated: { label: 'Update', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            deleted: { label: 'Delete', color: 'bg-rose-100 text-rose-700 border-rose-200' },
            login: { label: 'Login', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            logout: { label: 'Logout', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        };
        const op = operations[event] || { label: event.toUpperCase(), color: 'bg-gray-100 text-gray-700 border-gray-200' };
        return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider ${op.color}`}>{op.label}</span>;
    };

    const getIpAddress = (log) => {
        return log.properties?.ip_address || log.properties?.ip || '-';
    };

    const getStatus = (log) => {
        const isError = log.properties?.status === 'failed' || log.event.includes('failed');
        return isError ? (
            <span className="flex items-center justify-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-medium border border-rose-100">
                <XCircle className="w-3 h-3" /> Gagal
            </span>
        ) : (
            <span className="flex items-center justify-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" /> Sukses
            </span>
        );
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID')}`;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Business Log</h2>}
        >
            <Head title="Business Log" />
            
            <div className="py-12">
                <div className="max-w-[95%] mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Log Aktivitas Sistem</h3>
                                    <p className="text-sm text-slate-500">Pemantauan tindakan pengguna dan perubahan data.</p>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-slate-500 flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                <ShieldAlert className="w-4 h-4 text-amber-500" />
                                Akses Terbatas (Super Admin)
                            </div>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            
                            {/* Filter Search User */}
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                    placeholder="Cari nama user..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Filter Menu */}
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Filter className="h-5 w-5 text-slate-400" />
                                </div>
                                <select
                                    className="block w-full pl-10 border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm text-slate-700"
                                    value={menuFilter}
                                    onChange={(e) => setMenuFilter(e.target.value)}
                                >
                                    <option value="">Semua Menu</option>
                                    {Object.entries(availableMenus).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filter Tanggal */}
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="date"
                                    className="block w-full pl-10 border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm text-slate-700"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </div>

                            {/* Tombol Reset Filter */}
                            {(searchQuery || menuFilter || dateFilter) && (
                                <button 
                                    onClick={resetFilters}
                                    className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition text-sm font-bold shrink-0"
                                >
                                    <X className="w-4 h-4" /> Reset
                                </button>
                            )}

                            {/* --- TAMBAHKAN TOMBOL EXPORT DI SINI --- */}
                            <a 
                                href={route('settings.business-log.export', { 
                                    search: searchQuery, 
                                    menu: menuFilter, 
                                    date: dateFilter 
                                })}
                                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-bold shrink-0 shadow-sm shadow-emerald-200"
                            >
                                <Download className="w-4 h-4" /> Export
                            </a>

                        </div>
                    </div>

                    {/* Table Data */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4 w-[12%]">Waktu</th>
                                        <th className="px-5 py-4 w-[12%]">User</th>
                                        <th className="px-5 py-4 w-[12%]">Menu Diakses</th>
                                        <th className="px-5 py-4 w-[10%]">Operasi</th>
                                        <th className="px-5 py-4 w-[35%]">Detail Perubahan</th>
                                        <th className="px-5 py-4 w-[10%]">IP Address</th>
                                        <th className="px-5 py-4 w-[9%] text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition group align-top">
                                            {/* Kolom Waktu */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-mono text-slate-600 text-xs font-bold">
                                                    {formatDateTime(log.created_at)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase">ID: {log.id}</div>
                                            </td>

                                            {/* Kolom User */}
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-800">
                                                    {log.causer?.name || 'Sistem / Guest'}
                                                </div>
                                                {log.causer?.email && (
                                                    <div className="text-[10px] text-slate-500 truncate max-w-[120px]" title={log.causer.email}>
                                                        {log.causer.email}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Kolom Menu Diakses */}
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-slate-700">
                                                    {formatMenu(log.subject_type)}
                                                </div>
                                                {log.subject_id && (
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        Data ID: #{log.subject_id}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Kolom Kategori Operasi */}
                                            <td className="px-5 py-4">
                                                {formatOperation(log.event)}
                                            </td>

                                            {/* Kolom Detail Perubahan */}
                                            <td className="px-5 py-4">
                                                {(log.properties?.old || log.properties?.attributes) ? (
                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 text-[10px]">
                                                        {log.properties.old && (
                                                            <div className="bg-rose-50/50 p-2.5 rounded border border-rose-100">
                                                                <span className="font-bold text-rose-700 block mb-1 uppercase tracking-wide">Sebelum:</span>
                                                                <pre className="text-rose-600 whitespace-pre-wrap font-mono overflow-hidden max-h-32 overflow-y-auto">
                                                                    {JSON.stringify(log.properties.old, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                        {log.properties.attributes && (
                                                            <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                                                                <span className="font-bold text-emerald-700 block mb-1 uppercase tracking-wide">Sesudah:</span>
                                                                <pre className="text-emerald-600 whitespace-pre-wrap font-mono overflow-hidden max-h-32 overflow-y-auto">
                                                                    {JSON.stringify(log.properties.attributes, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600 italic text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 block">
                                                        {log.description}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Kolom IP Address */}
                                            <td className="px-5 py-4">
                                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                    {getIpAddress(log)}
                                                </span>
                                            </td>

                                            {/* Kolom Status */}
                                            <td className="px-5 py-4 text-center">
                                                {getStatus(log)}
                                            </td>
                                        </tr>
                                    ))}

                                    {logs.data.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                                        <Search className="w-6 h-6 text-slate-300" />
                                                    </div>
                                                    <p className="font-bold text-slate-600 text-lg">Tidak ada data ditemukan.</p>
                                                    <p className="text-sm mt-1 mb-4">Coba sesuaikan kata kunci atau filter pencarian Anda.</p>
                                                    {(searchQuery || menuFilter || dateFilter) && (
                                                        <button onClick={resetFilters} className="text-indigo-600 font-bold hover:underline">
                                                            Hapus Filter
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Links (Jika Datanya Banyak) */}
                        {logs.links && logs.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-center">
                                <div className="flex flex-wrap gap-1">
                                    {logs.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition font-medium ${
                                                !link.url ? 'text-slate-400 cursor-not-allowed' :
                                                link.active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
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