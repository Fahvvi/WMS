import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, ArrowDownLeft, ArrowUpRight, FileText } from 'lucide-react';

export default function TransactionIndex({ auth, transactions, type }) {
    // Pastikan type ada isinya, default ke inbound jika error
    const currentType = type || 'inbound';
    const isInbound = currentType === 'inbound';
    
    // Safety check: Pastikan transactions.data berbentuk array
    const transactionList = transactions?.data || [];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Transaksi ${isInbound ? 'Masuk' : 'Keluar'}`} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Page */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {isInbound ? <ArrowDownLeft className="text-indigo-600" /> : <ArrowUpRight className="text-orange-600" />}
                            Data {isInbound ? 'Inbound (Masuk)' : 'Outbound (Keluar)'}
                        </h2>
                        <p className="text-slate-500 text-sm">Kelola perpindahan stok barang Anda.</p>
                    </div>

                    <div className="flex gap-3">
                        {/* Tombol Buat Baru */}
                        <Link 
                            href={route('transactions.create', { type: currentType })}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold shadow-lg transition ${
                                isInbound ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'
                            }`}
                        >
                            <Plus className="w-5 h-5" /> Buat Transaksi
                        </Link>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">No. Transaksi</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Gudang</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User Input</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {transactionList.length > 0 ? (
                                transactionList.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-slate-700">
                                            {trx.trx_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {trx.trx_date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {/* Safety Check: Pakai tanda tanya (?) jaga-jaga kalau gudang dihapus */}
                                            {trx.warehouse?.name || '-'} 
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {trx.user?.name ? trx.user.name.charAt(0) : '?'}
                                                </div>
                                                {trx.user?.name || 'User Terhapus'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        Belum ada data transaksi {isInbound ? 'masuk' : 'keluar'}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Fix */}
                <div className="flex justify-center mt-8">
                    <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        {transactions?.links?.map((link, k) => (
                             link.url ? (
                                <Link 
                                    key={k} 
                                    href={link.url} 
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        link.active 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : null
                        ))}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}