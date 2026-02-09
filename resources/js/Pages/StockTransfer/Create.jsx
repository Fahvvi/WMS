import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRightLeft, Warehouse, Save, Plus, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

export default function StockTransferCreate({ auth, newTrfNumber, warehouses }) {
    // Note: Kita tidak butuh props 'products' lagi karena akan diambil via API
    
    const [lines, setLines] = useState([{ product_id: '', quantity: 1 }]);
    const [availableProducts, setAvailableProducts] = useState([]); // State Produk Dinamis
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        transfer_number: newTrfNumber,
        transfer_date: new Date().toISOString().split('T')[0],
        from_warehouse_id: '',
        to_warehouse_id: '',
        notes: '',
        items: []
    });

    // --- EFFECT: AMBIL PRODUK SAAT GUDANG ASAL BERUBAH ---
    useEffect(() => {
        if (data.from_warehouse_id) {
            setIsLoadingProducts(true);
            setLines([{ product_id: '', quantity: 1 }]); // Reset baris item
            
            window.axios.get(route('stock-transfers.get-stocks', data.from_warehouse_id))
                .then(response => {
                    setAvailableProducts(response.data);
                    setIsLoadingProducts(false);
                })
                .catch(error => {
                    console.error("Gagal mengambil stok", error);
                    setIsLoadingProducts(false);
                });
        } else {
            setAvailableProducts([]);
        }
    }, [data.from_warehouse_id]);

    // Handle Perubahan di Baris Item
    const handleLineChange = (index, field, value) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        setLines(newLines);
        setData('items', newLines);
    };

    const addLine = () => {
        setLines([...lines, { product_id: '', quantity: 1 }]);
    };

    const removeLine = (index) => {
        if (lines.length === 1) return;
        const newLines = [...lines];
        newLines.splice(index, 1);
        setLines(newLines);
        setData('items', newLines);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!data.from_warehouse_id || !data.to_warehouse_id) {
            return Swal.fire('Error', 'Pilih Gudang Asal dan Tujuan!', 'error');
        }
        
        if (data.from_warehouse_id === data.to_warehouse_id) {
            return Swal.fire('Error', 'Gudang Asal dan Tujuan tidak boleh sama!', 'error');
        }

        Swal.fire({
            title: 'Ajukan Transfer?',
            text: "Permintaan transfer stok akan diproses.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Ajukan',
            confirmButtonColor: '#4f46e5'
        }).then((result) => {
            if (result.isConfirmed) {
                data.items = lines;
                post(route('stock-transfers.store'));
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Transfer Stok Baru" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Page */}
                <div className="flex items-center justify-between mb-6">
                    <Link href={route('stock-transfers.index')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition">
                        <ArrowLeft className="w-5 h-5" /> Kembali
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRightLeft className="w-7 h-7 text-indigo-600" /> Form Transfer Stok
                    </h1>
                </div>

                {/* GRID LAYOUT: KIRI FORM, KANAN APPROVAL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- KOLOM KIRI: FORM (Span 2) --- */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8 space-y-8">
                            
                            {/* INFO DASAR */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel value="Nomor Dokumen (Auto)" />
                                    <TextInput value={data.transfer_number} className="w-full mt-1 bg-slate-100 text-slate-500 font-mono font-bold" readOnly />
                                </div>
                                <div>
                                    <InputLabel value="Tanggal Transfer" />
                                    <TextInput type="date" value={data.transfer_date} onChange={e => setData('transfer_date', e.target.value)} className="w-full mt-1" />
                                </div>
                            </div>

                            {/* PILIHAN RUTE GUDANG */}
                            <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-sm border border-indigo-100 z-10 hidden md:block">
                                    <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* DARI */}
                                    <div>
                                        <InputLabel value="DARI GUDANG (SUMBER)" className="text-indigo-800 mb-1.5 font-bold text-xs" />
                                        <div className="relative">
                                            <Warehouse className="absolute left-3 top-3 w-5 h-5 text-indigo-400" />
                                            <select 
                                                className="w-full pl-10 border-indigo-200 rounded-lg focus:ring-indigo-500 bg-white"
                                                value={data.from_warehouse_id}
                                                onChange={e => setData('from_warehouse_id', e.target.value)}
                                            >
                                                <option value="">-- Pilih Asal --</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                            </select>
                                        </div>
                                        {data.from_warehouse_id && (
                                            <p className="text-xs text-indigo-500 mt-1.5 flex items-center gap-1 animate-in fade-in">
                                                <CheckCircle2 className="w-3 h-3" /> Stok produk dimuat otomatis.
                                            </p>
                                        )}
                                        <InputError message={errors.from_warehouse_id} />
                                    </div>

                                    {/* KE */}
                                    <div>
                                        <InputLabel value="KE GUDANG (TUJUAN)" className="text-green-800 mb-1.5 font-bold text-xs" />
                                        <div className="relative">
                                            <Warehouse className="absolute left-3 top-3 w-5 h-5 text-green-500" />
                                            <select 
                                                className="w-full pl-10 border-green-200 rounded-lg focus:ring-green-500 bg-white"
                                                value={data.to_warehouse_id}
                                                onChange={e => setData('to_warehouse_id', e.target.value)}
                                            >
                                                <option value="">-- Pilih Tujuan --</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                            </select>
                                        </div>
                                        <InputError message={errors.to_warehouse_id} />
                                    </div>
                                </div>
                            </div>

                            {/* ITEM BARANG */}
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                                    Daftar Barang yang Dipindah
                                    {isLoadingProducts && <span className="text-xs font-normal text-slate-400 animate-pulse">(Memuat stok...)</span>}
                                </h3>

                                {!data.from_warehouse_id ? (
                                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                        <Warehouse className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-500 font-medium">Pilih "Gudang Asal" terlebih dahulu</p>
                                        <p className="text-xs text-slate-400">Daftar barang akan muncul sesuai ketersediaan stok.</p>
                                    </div>
                                ) : availableProducts.length === 0 && !isLoadingProducts ? (
                                    <div className="p-6 text-center bg-orange-50 rounded-xl border border-orange-100 text-orange-600">
                                        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                                        <p className="font-bold">Gudang Kosong</p>
                                        <p className="text-xs">Tidak ada stok tersedia di gudang ini untuk dipindahkan.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {lines.map((line, index) => {
                                            // Cari info produk terpilih untuk menampilkan sisa stok
                                            const selectedProd = availableProducts.find(p => p.id == line.product_id);
                                            
                                            return (
                                                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                                                    <div className="flex-1 w-full">
                                                        <div className="flex justify-between mb-1">
                                                            <InputLabel value="Produk" />
                                                            {selectedProd && <span className="text-xs font-bold text-indigo-600">Sisa Stok: {selectedProd.available_qty} {selectedProd.unit}</span>}
                                                        </div>
                                                        <select 
                                                            className="w-full border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                            value={line.product_id}
                                                            onChange={(e) => handleLineChange(index, 'product_id', e.target.value)}
                                                        >
                                                            <option value="">-- Pilih Produk --</option>
                                                            {availableProducts.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.sku} - {p.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="w-full sm:w-32">
                                                        <InputLabel value="Qty Transfer" className="mb-1" />
                                                        <TextInput 
                                                            type="number" 
                                                            className="w-full text-center font-bold" 
                                                            min="1"
                                                            max={selectedProd ? selectedProd.available_qty : ''} // Limit input sesuai stok
                                                            value={line.quantity}
                                                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                                                        />
                                                    </div>
                                                    
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeLine(index)}
                                                        className="w-full sm:w-auto p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg sm:mb-[2px] flex justify-center items-center transition"
                                                        disabled={lines.length === 1}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        
                                        <div className="mt-2">
                                            <button type="button" onClick={addLine} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 rounded transition">
                                                <Plus className="w-4 h-4" /> Tambah Baris
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <InputError message={errors.items} className="mt-2" />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={processing || (availableProducts.length === 0)} 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" /> Proses Transfer
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* --- KOLOM KANAN: APPROVAL WORKFLOW (Visual) --- */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Workflow Approval</h3>
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold">Draft</span>
                            </div>
                            
                            <div className="p-6 relative">
                                {/* Garis Vertikal Timeline */}
                                <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-slate-200"></div>

                                <div className="space-y-8">
                                    
                                    {/* Step 1: Supervisor (Pending) */}
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 w-6 h-6 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center shrink-0 mt-1">
                                            <Clock className="w-3 h-3 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">To-dos / Pending</p>
                                            <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center text-[10px] font-bold text-orange-700">SPV</div>
                                                    <span className="font-bold text-sm text-slate-800">Supervisor Gudang</span>
                                                </div>
                                                <p className="text-xs text-orange-600 font-medium">
                                                    Menunggu persetujuan...
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2: User (Current) */}
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 w-6 h-6 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-green-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Submitter</p>
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                                        {auth.user.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-sm text-slate-800">Anda (Me)</span>
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                <p className="text-xs text-slate-400">
                                    Dokumen ini akan otomatis terkirim ke Supervisor setelah Anda klik "Proses Transfer".
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}