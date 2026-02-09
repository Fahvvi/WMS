import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRightLeft, Plus, Search, Calendar, Package, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function StockTransferIndex({ auth, transfers }) {
    const [searchTerm, setSearchTerm] = useState('');

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Riwayat Transfer Stok" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <ArrowRightLeft className="w-8 h-8 text-indigo-600" /> Riwayat Transfer Stok
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Log perpindahan barang antar gudang.
                            </p>
                        </div>
                        
                        <Link 
                            href={route('stock-transfers.create')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" /> Transfer Baru
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* SEARCH */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Cari nomor transfer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">No. Transfer</th>
                                        <th className="px-6 py-4 font-bold">Rute</th>
                                        <th className="px-6 py-4 font-bold">Barang</th>
                                        <th className="px-6 py-4 font-bold">Oleh</th>
                                        <th className="px-6 py-4 font-bold text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transfers.data.length > 0 ? (
                                        transfers.data.map((trf) => (
                                            <tr key={trf.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-indigo-600">
                                                        {trf.transfer_number}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(trf.transfer_date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded border">{trf.from_warehouse?.code}</span>
                                                        <ArrowRight className="w-4 h-4 text-slate-300" />
                                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">{trf.to_warehouse?.code}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        {trf.from_warehouse?.name} → {trf.to_warehouse?.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{trf.product?.name}</div>
                                                    <div className="text-xs text-slate-500">Qty: <b className="text-slate-800">{trf.quantity}</b> {trf.product?.unit}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {trf.user?.name}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
                                                        Selesai
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">Belum ada riwayat transfer.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION FIX (SOLUSI ERROR WHITE SCREEN) */}
                        {transfers.links && transfers.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-center">
                                <div className="flex gap-1 flex-wrap justify-center">
                                    {transfers.links.map((link, i) => (
                                        link.url ? (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                className={`px-3 py-1 text-sm rounded-md transition ${
                                                    link.active 
                                                    ? 'bg-indigo-600 text-white font-bold' 
                                                    : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={i}
                                                className="px-3 py-1 text-sm rounded-md text-slate-300 cursor-not-allowed"
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