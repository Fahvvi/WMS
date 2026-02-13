import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRightLeft, Warehouse, Save, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

export default function StockTransferCreate({ auth, newTransferNumber, warehouses }) {
    
    const [lines, setLines] = useState([{ product_id: '', quantity: 1 }]);
    const [availableProducts, setAvailableProducts] = useState([]); 
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        transfer_number: newTransferNumber,
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
            setLines([{ product_id: '', quantity: 1 }]); // Reset baris item saat ganti gudang
            
            window.axios.get(route('stock-transfers.get-stocks', data.from_warehouse_id))
                .then(response => {
                    setAvailableProducts(response.data);
                    setIsLoadingProducts(false);
                })
                .catch(error => {
                    console.error("Gagal mengambil stok", error);
                    setIsLoadingProducts(false);
                    Swal.fire('Error', 'Gagal memuat data stok gudang.', 'error');
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
        // Penting: Update data form inertia juga agar sinkron
        setData('items', newLines);
    };

    const addLine = () => {
        const newLines = [...lines, { product_id: '', quantity: 1 }];
        setLines(newLines);
        setData('items', newLines);
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
        
        // 1. Validasi Frontend Sederhana
        if (!data.from_warehouse_id || !data.to_warehouse_id) {
            return Swal.fire('Error', 'Pilih Gudang Asal dan Tujuan!', 'error');
        }
        
        if (data.from_warehouse_id === data.to_warehouse_id) {
            return Swal.fire('Error', 'Gudang Asal dan Tujuan tidak boleh sama!', 'error');
        }

        // Cek apakah ada produk yang belum dipilih (kosong)
        const hasEmptyProduct = lines.some(line => !line.product_id);
        if (hasEmptyProduct) {
            return Swal.fire('Error', 'Pastikan semua baris produk telah dipilih.', 'error');
        }

        Swal.fire({
            title: 'Ajukan Transfer?',
            text: "Permintaan transfer stok akan dikirim untuk persetujuan Supervisor.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Ajukan',
            confirmButtonColor: '#4f46e5',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                // Pastikan data items terisi dari state lines sebelum kirim
                data.items = lines; 
                
                post(route('stock-transfers.store'), {
                    onSuccess: () => {
                        // Sukses akan redirect oleh controller
                    },
                    onError: (err) => {
                        console.error("Validation Errors:", err);
                        
                        // --- PERBAIKAN: Tampilkan pesan error APAPUN yang dikirim backend ---
                        // Mengambil pesan error pertama dari object error
                        const firstErrorMessage = Object.values(err)[0];
                        
                        Swal.fire({
                            title: 'Gagal Menyimpan',
                            text: firstErrorMessage || 'Terjadi kesalahan validasi data.',
                            icon: 'error'
                        });
                    }
                });
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Buat Transfer Stok" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Page */}
                <div className="flex items-center justify-between mb-6">
                    <Link href={route('stock-transfers.index')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition group">
                        <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="font-medium">Kembali</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <ArrowRightLeft className="w-6 h-6" />
                        </span>
                        Form Transfer Stok
                    </h1>
                </div>

                {/* GRID LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- KOLOM KIRI: FORM (Span 2) --- */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8 space-y-8">
                            
                            {/* INFO DASAR */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel value="Nomor Dokumen (Auto)" />
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-400 font-mono text-sm">#</span>
                                        </div>
                                        <TextInput 
                                            value={data.transfer_number} 
                                            className="w-full pl-8 bg-slate-50 text-slate-500 font-mono font-bold border-slate-200 cursor-not-allowed" 
                                            readOnly 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel value="Tanggal Transfer" />
                                    <TextInput 
                                        type="date" 
                                        value={data.transfer_date} 
                                        onChange={e => setData('transfer_date', e.target.value)} 
                                        className="w-full mt-1 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" 
                                    />
                                    <InputError message={errors.transfer_date} className="mt-1" />
                                </div>
                            </div>

                            {/* PILIHAN RUTE GUDANG */}
                            <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md border border-indigo-100 z-10 hidden md:flex items-center justify-center">
                                    <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* DARI */}
                                    <div>
                                        <InputLabel value="DARI GUDANG (SUMBER)" className="text-indigo-800 mb-2 font-bold text-xs tracking-wider" />
                                        <div className="relative">
                                            <Warehouse className="absolute left-3 top-3 w-5 h-5 text-indigo-400 pointer-events-none" />
                                            <select 
                                                className="w-full pl-10 border-indigo-200 rounded-lg focus:ring-indigo-500 bg-white h-11 text-sm shadow-sm"
                                                value={data.from_warehouse_id}
                                                onChange={e => setData('from_warehouse_id', e.target.value)}
                                            >
                                                <option value="">-- Pilih Asal --</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                            </select>
                                        </div>
                                        {data.from_warehouse_id && (
                                            <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Stok produk dimuat otomatis.
                                            </p>
                                        )}
                                        <InputError message={errors.from_warehouse_id} />
                                    </div>

                                    {/* KE */}
                                    <div>
                                        <InputLabel value="KE GUDANG (TUJUAN)" className="text-teal-800 mb-2 font-bold text-xs tracking-wider" />
                                        <div className="relative">
                                            <Warehouse className="absolute left-3 top-3 w-5 h-5 text-teal-500 pointer-events-none" />
                                            <select 
                                                className="w-full pl-10 border-teal-200 rounded-lg focus:ring-teal-500 bg-white h-11 text-sm shadow-sm"
                                                value={data.to_warehouse_id}
                                                onChange={e => setData('to_warehouse_id', e.target.value)}
                                            >
                                                <option value="">-- Pilih Tujuan --</option>
                                                {warehouses
                                                    .filter(w => w.id != data.from_warehouse_id) // Filter agar tidak bisa pilih gudang asal
                                                    .map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                            </select>
                                        </div>
                                        <InputError message={errors.to_warehouse_id} />
                                    </div>
                                </div>
                            </div>

                            {/* ITEM BARANG */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        Item Transfer
                                        {isLoadingProducts && (
                                            <span className="flex items-center gap-1 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Memuat stok...
                                            </span>
                                        )}
                                    </h3>
                                    
                                    {availableProducts.length > 0 && (
                                        <button 
                                            type="button" 
                                            onClick={addLine} 
                                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                        >
                                            <Plus className="w-4 h-4" /> Tambah Baris
                                        </button>
                                    )}
                                </div>

                                {!data.from_warehouse_id ? (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                                        <Warehouse className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-600 font-medium">Pilih "Gudang Asal" terlebih dahulu</p>
                                        <p className="text-xs text-slate-400 mt-1">Daftar barang akan muncul sesuai ketersediaan stok di gudang tersebut.</p>
                                    </div>
                                ) : availableProducts.length === 0 && !isLoadingProducts ? (
                                    <div className="p-6 text-center bg-orange-50 rounded-xl border border-orange-200 text-orange-700">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
                                        <p className="font-bold text-lg">Gudang Kosong</p>
                                        <p className="text-sm opacity-80">Tidak ada stok tersedia di gudang ini untuk dipindahkan.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
                                        {lines.map((line, index) => {
                                            // Cari info produk terpilih untuk menampilkan sisa stok
                                            const selectedProd = availableProducts.find(p => p.id == line.product_id);
                                            
                                            return (
                                                <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-white p-4 rounded-xl shadow-sm border border-slate-200 ring-1 ring-transparent hover:ring-indigo-100 transition-all">
                                                    
                                                    {/* DROP DOWN PRODUK */}
                                                    <div className="flex-1 w-full">
                                                        <div className="flex justify-between mb-1.5">
                                                            <InputLabel value={`Barang #${index + 1}`} className="text-xs text-slate-500" />
                                                            {selectedProd && (
                                                                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                                                    Sisa: {selectedProd.available_qty} {selectedProd.unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <select 
                                                            className="w-full border-slate-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500 h-10"
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
                                                        {errors[`items.${index}.product_id`] && (
                                                            <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.product_id`]}</p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* INPUT QTY */}
                                                    <div className="w-full sm:w-32">
                                                        <InputLabel value="Qty Transfer" className="mb-1.5 text-xs text-slate-500" />
                                                        <div className="relative">
                                                            <TextInput 
                                                                type="number" 
                                                                className="w-full text-center font-bold h-10" 
                                                                min="1"
                                                                max={selectedProd ? selectedProd.available_qty : ''}
                                                                value={line.quantity}
                                                                onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                                                                placeholder="0"
                                                            />
                                                            {selectedProd && (
                                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                                                                    {selectedProd.unit}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {errors[`items.${index}.quantity`] && (
                                                            <p className="text-xs text-red-600 mt-1">{errors[`items.${index}.quantity`]}</p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* BUTTON DELETE */}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeLine(index)}
                                                        className={`w-full sm:w-10 h-10 flex justify-center items-center rounded-lg border transition ${
                                                            lines.length === 1 
                                                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                                                            : 'bg-white border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 shadow-sm'
                                                        }`}
                                                        disabled={lines.length === 1}
                                                        title="Hapus Baris"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <InputError message={errors.items} className="mt-2 text-center" />
                            </div>

                            {/* NOTES & SUBMIT */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div>
                                    <InputLabel value="Catatan Tambahan (Opsional)" />
                                    <textarea 
                                        className="w-full mt-1 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                        rows="2"
                                        placeholder="Contoh: Permintaan urgent dari tim produksi..."
                                        value={data.notes}
                                        onChange={e => setData('notes', e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={processing || (availableProducts.length === 0)} 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" /> Ajukan Transfer
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* --- KOLOM KANAN: APPROVAL WORKFLOW (Visual) --- */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Workflow Approval</h3>
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold uppercase tracking-wide">
                                    Preview
                                </span>
                            </div>
                            
                            <div className="p-6 relative">
                                {/* Garis Vertikal Timeline */}
                                <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-slate-200"></div>

                                <div className="space-y-8">
                                    
                                    {/* Step 1: Supervisor (Pending) */}
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 w-6 h-6 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                            <AlertCircle className="w-3 h-3 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Menunggu Persetujuan</p>
                                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-800">SPV</div>
                                                    <span className="font-bold text-sm text-slate-800">Supervisor</span>
                                                </div>
                                                <p className="text-xs text-amber-700 font-medium">
                                                    Status akan menjadi "Pending" setelah Anda submit.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2: User (Current) */}
                                    <div className="relative flex gap-4">
                                        <div className="relative z-10 w-6 h-6 rounded-full bg-indigo-100 border-2 border-indigo-500 flex items-center justify-center shrink-0 mt-1 shadow-sm shadow-indigo-100">
                                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pembuat (Draft)</p>
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                        {auth.user.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-sm text-slate-800">Anda (Sekarang)</span>
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
                                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    Data akan dikunci setelah diajukan.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}