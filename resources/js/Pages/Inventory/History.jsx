import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, History, ArrowDownLeft, ArrowUpRight, Calendar, User, MapPin } from 'lucide-react';

export default function ProductHistory({ auth, product, history }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('products.index')} className="p-2 bg-white rounded-full text-slate-500 hover:text-indigo-600 shadow-sm transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="font-bold text-xl text-slate-800 leading-tight flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-600" /> Riwayat Produk
                        </h2>
                        <p className="text-sm text-slate-500">{product.name} ({product.sku})</p>
                    </div>
                </div>
            }
        >
            <Head title={`History - ${product.name}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {history.data.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {history.data.map((log) => (
                                <div key={log.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    
                                    {/* Bagian Kiri: Info Transaksi */}
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${log.transaction.type === 'inbound' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {log.transaction.type === 'inbound' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-bold text-slate-800 text-sm bg-slate-100 px-2 py-0.5 rounded">
                                                    {log.transaction.trx_number}
                                                </span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.transaction.type === 'inbound' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                                                    {log.transaction.type === 'inbound' ? 'INBOUND' : 'OUTBOUND'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(log.transaction.trx_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {log.transaction.user?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bagian Kanan: Lokasi & Qty */}
                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 mb-1 flex items-center justify-end gap-1">
                                                <MapPin className="w-3 h-3" /> Lokasi Gudang
                                            </p>
                                            <p className="font-bold text-slate-700">{log.transaction.warehouse?.name}</p>
                                        </div>
                                        <div className="text-right min-w-[80px]">
                                            <p className="text-xs text-slate-400 mb-1">Quantity</p>
                                            <p className={`text-xl font-bold ${log.transaction.type === 'inbound' ? 'text-green-600' : 'text-red-600'}`}>
                                                {log.transaction.type === 'inbound' ? '+' : '-'}{log.quantity}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase">{product.unit}</p>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            Belum ada riwayat transaksi untuk produk ini.
                        </div>
                    )}
                    
                    {/* Pagination */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
                        <div className="flex gap-1">
                            {history.links.map((link, k) => (
                                link.url ? (
                                    <Link 
                                        key={k} 
                                        href={link.url} 
                                        className={`px-3 py-1 text-xs font-medium rounded border ${link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : null
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}