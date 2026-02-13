import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, Plus, Search, Eye, MapPin, Calendar, FileText } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce'; // Pastikan install: npm install use-debounce

export default function StockOpnameIndex({ auth, opnames, filters }) {
    
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
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Riwayat Stock Opname</h2>}
        >
            <Head title="Stock Opname" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-2xl border border-slate-200">
                        
                        {/* Header & Toolbar */}
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                            
                            {/* Search Box */}
                            <div className="relative w-full md:w-96 group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition" />
                                </div>
                                <TextInput 
                                    className="block w-full pl-10 border-slate-300 rounded-xl bg-white focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm" 
                                    placeholder="Cari nomor opname..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Tombol Tambah (Hanya jika punya izin) */}
                            <Link
                                href={route('stock-opnames.create')}
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition active:scale-95"
                            >
                                <Plus className="w-5 h-5" /> Buat Opname Baru
                            </Link>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Nomor Dokumen</th>
                                        <th className="px-6 py-4 font-bold">Lokasi Gudang</th>
                                        <th className="px-6 py-4 font-bold">Petugas</th>
                                        <th className="px-6 py-4 font-bold">Total Item</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 text-right font-bold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {opnames.data.length > 0 ? (
                                        opnames.data.map((so) => (
                                            <tr key={so.id} className="hover:bg-slate-50 transition group">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-indigo-600 text-base">
                                                        {so.opname_number}
                                                    </div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3" /> 
                                                        {new Date(so.opname_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                                                            <MapPin className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium text-slate-700">{so.warehouse.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                            {so.user.name.charAt(0)}
                                                        </div>
                                                        <span>{so.user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                        {so.details_count} Item
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200 flex w-fit items-center gap-1">
                                                        <ClipboardList className="w-3 h-3" /> Selesai
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {/* Tombol Detail (Pastikan route 'show' sudah ada atau gunakan ID sementara) */}
                                                    <Link 
                                                        href={route('stock-opnames.show', so.id)} // <--- SUDAH DIGANTI
                                                        className="inline-flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                                    <p className="font-medium">Belum ada data Stock Opname.</p>
                                                    <p className="text-xs mt-1">Data akan muncul setelah Anda melakukan opname.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {opnames.links && opnames.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-center">
                                <div className="flex gap-1 flex-wrap justify-center">
                                    {opnames.links.map((link, i) => (
                                        link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                className={`px-3 py-1.5 text-sm rounded-lg transition font-medium ${
                                                    link.active 
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                                                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 text-sm rounded-lg text-slate-300 cursor-not-allowed"
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