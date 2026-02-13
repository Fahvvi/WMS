import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, MapPin, User, FileText, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function StockOpnameShow({ auth, opname }) {
    
    // 1. FILTER: Hanya ambil item yang ada selisih (Fisik Beda dengan Sistem)
    const discrepancyItems = opname.details.filter(item => item.actual_qty !== item.system_qty);
    
    // Hitung total selisih (netto)
    const totalDiff = discrepancyItems.reduce((acc, item) => acc + (item.actual_qty - item.system_qty), 0);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight print:hidden">Detail Stock Opname</h2>}
        >
            <Head title={`Opname ${opname.opname_number}`} />

            <div className="py-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* --- NAVIGASI (Disembunyikan saat Print) --- */}
                    <div className="flex justify-between items-center mb-6 print:hidden">
                        <Link href={route('stock-opnames.index')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition">
                            <ArrowLeft className="w-5 h-5" /> Kembali ke Riwayat
                        </Link>
                        <button 
                            onClick={() => window.print()} 
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition active:scale-95"
                        >
                            <Printer className="w-5 h-5" /> Cetak Laporan Resmi
                        </button>
                    </div>

                    {/* --- AREA LAPORAN (Ini yang akan dicetak) --- 
                        Class 'print:...' di bawah ini akan mengubah tampilan saat masuk mode cetak 
                        menjadi layar penuh putih bersih tanpa gangguan layout website.
                    */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden 
                                    print:fixed print:inset-0 print:z-[100] print:bg-white print:w-full print:h-full print:border-none print:shadow-none print:rounded-none print:overflow-visible">
                        
                        {/* HEADER LAPORAN (Kop Surat Sederhana) */}
                        <div className="p-8 border-b-2 border-slate-100 print:border-black">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800 print:text-black">Laporan Stock Opname</h1>
                                    <p className="text-slate-500 mt-1 print:text-black">Laporan Penyesuaian & Selisih Stok</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono font-bold text-indigo-600 print:text-black">{opname.opname_number}</div>
                                    <div className="text-sm text-slate-500 mt-1 print:text-black">
                                        Tanggal: {new Date(opname.opname_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-3 gap-8 mt-8 text-sm">
                                <div>
                                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Gudang Lokasi</span>
                                    <span className="font-bold text-slate-700 text-lg print:text-black flex items-center gap-2">
                                        <MapPin className="w-4 h-4 print:hidden" /> {opname.warehouse?.name}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Auditor / Petugas</span>
                                    <span className="font-bold text-slate-700 text-lg print:text-black flex items-center gap-2">
                                        <User className="w-4 h-4 print:hidden" /> {opname.user?.name}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Item Selisih</span>
                                    <span className={`font-bold text-lg flex items-center gap-2 ${discrepancyItems.length > 0 ? 'text-red-600' : 'text-green-600'} print:text-black`}>
                                        <AlertTriangle className="w-4 h-4 print:hidden" /> {discrepancyItems.length} Item
                                    </span>
                                </div>
                            </div>

                            {/* Catatan Dokumen */}
                            {opname.notes && (
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 print:border print:border-slate-300 print:bg-white">
                                    <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Catatan Dokumen:</span>
                                    <p className="text-slate-700 italic print:text-black">"{opname.notes}"</p>
                                </div>
                            )}
                        </div>

                        {/* TABEL DATA */}
                        <div className="p-8 min-h-[400px]">
                            {discrepancyItems.length > 0 ? (
                                <>
                                    <div className="mb-4 flex items-center gap-2 text-slate-500 text-sm print:hidden">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                        <span>Menampilkan <b>{discrepancyItems.length}</b> barang yang memiliki selisih stok. Barang yang sesuai disembunyikan.</span>
                                    </div>

                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                                <th className="py-3 print:text-black">Produk / SKU</th>
                                                <th className="py-3 text-center print:text-black">Stok Sistem</th>
                                                <th className="py-3 text-center print:text-black">Stok Fisik</th>
                                                <th className="py-3 text-center print:text-black">Selisih</th>
                                                <th className="py-3 w-1/3 print:text-black">Keterangan / Catatan Item</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 border-b border-slate-100">
                                            {discrepancyItems.map((item, index) => {
                                                const diff = item.actual_qty - item.system_qty;
                                                return (
                                                    <tr key={item.id} className="group print:break-inside-avoid">
                                                        <td className="py-4 align-top">
                                                            <div className="font-bold text-slate-800 print:text-black">{item.product?.name}</div>
                                                            <div className="text-xs font-mono text-slate-500 mt-0.5 print:text-black">{item.product?.sku}</div>
                                                        </td>
                                                        <td className="py-4 text-center align-top font-mono text-slate-500 print:text-black">
                                                            {item.system_qty} <span className="text-[10px]">{item.product?.unit}</span>
                                                        </td>
                                                        <td className="py-4 text-center align-top font-bold text-slate-800 print:text-black">
                                                            {item.actual_qty}
                                                        </td>
                                                        <td className="py-4 text-center align-top">
                                                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded font-bold text-xs print:border print:border-black print:text-black ${
                                                                diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {diff > 0 ? '+' : ''}{diff}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 align-top text-sm">
                                                            {item.notes ? (
                                                                <span className="text-slate-700 print:text-black">{item.notes}</span>
                                                            ) : (
                                                                <span className="text-slate-300 italic print:hidden">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {/* Footer Tabel untuk Total */}
                                        <tfoot>
                                            <tr className="bg-slate-50 print:bg-white print:border-t-2 print:border-black">
                                                <td colSpan="3" className="py-4 text-right font-bold uppercase text-xs text-slate-500 pr-4 print:text-black">Total Selisih Unit:</td>
                                                <td className={`py-4 text-center font-bold print:text-black ${totalDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {totalDiff > 0 ? '+' : ''}{totalDiff}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </>
                            ) : (
                                // Tampilan Jika Hasil Opname PERFECT (Tidak ada selisih)
                                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-green-200 rounded-2xl bg-green-50/50 print:border-black print:bg-white">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 print:hidden">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-green-800 print:text-black">Hasil Opname Sesuai!</h3>
                                    <p className="text-green-700 max-w-md mt-2 print:text-black">
                                        Tidak ditemukan selisih antara stok sistem dan fisik pada lokasi <b>{opname.warehouse?.name}</b>.
                                    </p>
                                    <p className="mt-4 font-mono text-sm text-slate-500 print:text-black">
                                        Total Item Diperiksa: <b>{opname.details.length}</b>
                                    </p>
                                </div>
                            )}

                            {/* Tanda Tangan (Hanya muncul saat Print / Layar besar) */}
                            <div className="mt-20 grid grid-cols-3 gap-8 text-center break-inside-avoid print:flex print:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-400 mb-20 print:text-black">Dibuat Oleh (Admin)</p>
                                    <div className="border-t border-slate-300 w-2/3 mx-auto print:border-black pt-2 font-bold text-slate-700 print:text-black">
                                        {opname.user?.name}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-400 mb-20 print:text-black">Diperiksa Oleh (Spv)</p>
                                    <div className="border-t border-slate-300 w-2/3 mx-auto print:border-black pt-2 font-bold text-slate-700 print:text-black">
                                        ( ........................... )
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-400 mb-20 print:text-black">Diketahui Oleh (Manager)</p>
                                    <div className="border-t border-slate-300 w-2/3 mx-auto print:border-black pt-2 font-bold text-slate-700 print:text-black">
                                        ( ........................... )
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}