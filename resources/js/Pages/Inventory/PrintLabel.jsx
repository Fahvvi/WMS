import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Printer, ArrowLeft, QrCode, Barcode, CheckCircle } from 'lucide-react';

export default function PrintLabel({ auth, product, barcodeType, barcodeImage }) {
    
    const switchType = (type) => {
        router.get(route('products.print', product.id), { type: type }, { preserveScroll: true });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Print Label - ${product.sku}`} />

            <div className="py-4 md:py-8 max-w-2xl mx-auto px-4 sm:px-6">
                
                {/* Header Nav (Responsive Flex) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
                    <Link href={route('products.index')} className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 group w-fit">
                        <div className="p-1 rounded-full group-hover:bg-indigo-50 transition">
                            <ArrowLeft size={18} /> 
                        </div>
                        <span className="font-medium">Kembali</span>
                    </Link>
                    <h2 className="text-lg md:text-xl font-bold text-slate-800">Cetak Label Produk</h2>
                </div>

                <div className="bg-white p-4 md:p-8 rounded-2xl shadow-lg border border-slate-100">
                    
                    {/* --- CONTROLS (Responsive Grid) --- */}
                    <div className="mb-8 bg-slate-50 p-4 rounded-xl no-print">
                        <p className="text-sm font-semibold text-slate-500 mb-3 text-center sm:text-left">Pilih Format Barcode:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button 
                                onClick={() => switchType('C128')}
                                className={`flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition border ${
                                    barcodeType === 'C128' 
                                    ? 'bg-white border-indigo-500 text-indigo-700 shadow-md ring-1 ring-indigo-500' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                <Barcode size={20} /> 
                                <span className="font-medium">Code 128 (Batang)</span>
                                {barcodeType === 'C128' && <CheckCircle size={16} className="text-indigo-500 ml-auto" />}
                            </button>

                            <button 
                                onClick={() => switchType('QR')}
                                className={`flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition border ${
                                    barcodeType === 'QR' 
                                    ? 'bg-white border-indigo-500 text-indigo-700 shadow-md ring-1 ring-indigo-500' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                <QrCode size={20} /> 
                                <span className="font-medium">QR Code (Kotak)</span>
                                {barcodeType === 'QR' && <CheckCircle size={16} className="text-indigo-500 ml-auto" />}
                            </button>
                        </div>
                    </div>

                    {/* --- AREA PREVIEW (Scrollable Container untuk HP Kecil) --- */}
                    <div className="flex justify-center bg-slate-100/50 p-4 md:p-8 rounded-xl border border-dashed border-slate-300 overflow-x-auto">
                        {/* Container Label Fix Size (W=300px, H=200px) 
                            Ini mensimulasikan ukuran stiker thermal standard 
                        */}
                        <div className="print-area bg-white border border-gray-200 shadow-sm p-4 rounded-lg flex flex-col items-center text-center justify-center flex-shrink-0"
                             style={{ width: '300px', height: '200px' }}>
                            
                            <p className="text-sm font-bold uppercase tracking-wider mb-2 text-black line-clamp-1 w-full">
                                {product.name}
                            </p>
                            
                            {/* Barcode Image */}
                            <div className="my-2 mix-blend-multiply" dangerouslySetInnerHTML={{ __html: barcodeImage }} />
                            
                            <p className="font-mono text-lg font-bold mt-1 text-black tracking-wide">
                                {product.barcode || product.sku}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase">
                                {product.category}
                            </p>
                        </div>
                    </div>

                    {/* Tombol Cetak (Sticky Bottom di Mobile agar mudah dijangkau) */}
                    <div className="mt-8 no-print">
                        <button 
                            onClick={handlePrint}
                            className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl hover:bg-slate-800 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                        >
                            <Printer size={20} /> 
                            <span className="font-bold text-lg">Cetak Sekarang</span>
                        </button>
                        <p className="text-xs text-center text-slate-400 mt-3">
                            *Pastikan printer thermal terhubung. Gunakan layout Portrait.
                        </p>
                    </div>
                </div>
            </div>

            {/* CSS Print & Mobile Adjustments */}
            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    
                    /* Reset Layout untuk Print */
                    .print-area { 
                        border: none !important; 
                        box-shadow: none !important;
                        margin: 0 auto; 
                        width: 100% !important; 
                        height: 100% !important;
                        page-break-inside: avoid;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    nav, header, footer { display: none; }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}