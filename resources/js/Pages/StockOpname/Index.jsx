import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ClipboardList, Plus, Search, Eye, MapPin, Calendar } from 'lucide-react';
import TextInput from '@/Components/TextInput';

export default function StockOpnameIndex({ auth, opnames }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Riwayat Stock Opname</h2>}
        >
            <Head title="Stock Opname" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-slate-200">
                        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-96">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <TextInput 
                                    className="block w-full pl-10 border-slate-300 rounded-xl bg-slate-50 focus:bg-white transition" 
                                    placeholder="Cari nomor opname..." 
                                />
                            </div>
                            <Link
                                href={route('stock-opnames.create')}
                                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition"
                            >
                                <Plus className="w-5 h-5" /> Buat Opname Baru
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Nomor & Tanggal</th>
                                        <th className="px-6 py-4">Gudang</th>
                                        <th className="px-6 py-4">Petugas</th>
                                        <th className="px-6 py-4">Catatan</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {opnames.data.map((so) => (
                                        <tr key={so.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{so.opname_number}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {so.opname_date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 uppercase font-medium flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400" /> {so.warehouse.name}
                                            </td>
                                            <td className="px-6 py-4">{so.user.name}</td>
                                            <td className="px-6 py-4 italic text-slate-400">{so.notes || '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {opnames.data.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-slate-400">Belum ada data Stock Opname.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}