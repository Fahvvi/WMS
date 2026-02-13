import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, MapPin, ScanBarcode, Save, Loader2, RefreshCw, Search, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';

export default function StockOpnameCreate({ auth, warehouses = [], newOpnameNumber }) {
    
    // State UI
    const [scanMode, setScanMode] = useState('warehouse'); 
    const [scanInput, setScanInput] = useState('');
    const [scannedWarehouse, setScannedWarehouse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // State Data
    const [allItems, setAllItems] = useState([]); 
    const [filteredItems, setFilteredItems] = useState([]);

    const inputRef = useRef(null); 

    const { data, setData, post, processing } = useForm({
        opname_number: newOpnameNumber,
        opname_date: new Date().toISOString().split('T')[0],
        warehouse_id: '',
        notes: '', // Catatan Umum Dokumen
        items: [], 
    });

    useEffect(() => {
        if(inputRef.current) inputRef.current.focus();
    }, [scanMode, isLoading]);

    const handleScan = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            const code = scanInput.trim();
            if (!code) return;

            if (scanMode === 'warehouse') {
                processWarehouseScan(code);
            } else {
                processProductSearch(code);
            }
            setScanInput(''); 
        }
    };

    const processWarehouseScan = (code) => {
        const found = warehouses.find(w => 
            w.code.toLowerCase() === code.toLowerCase() || 
            w.name.toLowerCase().includes(code.toLowerCase())
        );

        if (found) {
            selectWarehouse(found);
        } else {
            toast.error('Gudang tidak ditemukan!');
        }
    };

    const selectWarehouse = (warehouse) => {
        setScannedWarehouse(warehouse);
        setData('warehouse_id', warehouse.id);
        setScanMode('product'); 
        fetchSnapshot(warehouse.id);
    };

    const fetchSnapshot = async (warehouseId) => {
        setIsLoading(true);
        try {
            const response = await window.axios.get(route('stock-opnames.snapshot', warehouseId));
            
            const mappedData = response.data.map(p => ({
                product_id: p.id,
                name: p.name,
                sku: p.sku,
                unit: p.unit,
                system_stock: p.system_qty,
                physical_stock: p.system_qty, 
                difference: 0,
                notes: '' // Default catatan item kosong
            }));

            setAllItems(mappedData);
            setFilteredItems(mappedData);
            toast.success(`Data stok dimuat: ${mappedData.length} item.`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data stok.");
            setScanMode('warehouse');
            setData('warehouse_id', '');
            setScannedWarehouse(null);
        } finally {
            setIsLoading(false);
        }
    };

    const processProductSearch = (code) => {
        const keyword = code.toLowerCase();
        const results = allItems.filter(item => 
            item.sku.toLowerCase().includes(keyword) || 
            item.name.toLowerCase().includes(keyword)
        );

        if (results.length > 0) {
            setFilteredItems(results);
            toast.success(`${results.length} barang ditemukan.`);
        } else {
            toast.error('Barang tidak ditemukan.');
            setFilteredItems(allItems); 
        }
    };

    // Handle Edit Qty Fisik
    const handlePhysicalChange = (productId, value) => {
        const val = parseInt(value) || 0;
        updateItemState(productId, { 
            physical_stock: val, 
            difference: val - getItemSystemStock(productId) 
        });
    };

    // Handle Edit Catatan Item
    const handleNotesChange = (productId, value) => {
        updateItemState(productId, { notes: value });
    };

    // Helper: Ambil stok sistem dari master data
    const getItemSystemStock = (id) => {
        const item = allItems.find(i => i.product_id === id);
        return item ? item.system_stock : 0;
    };

    // Helper: Update state di Master & Filtered agar sinkron
    const updateItemState = (productId, newValues) => {
        const updater = (list) => list.map(item => 
            item.product_id === productId ? { ...item, ...newValues } : item
        );
        
        setAllItems(prev => updater(prev));
        setFilteredItems(prev => updater(prev));
    };

    const resetFilter = () => {
        setFilteredItems(allItems);
        setScanInput('');
        if(inputRef.current) inputRef.current.focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(allItems.length === 0) return toast.error("Data stok kosong!");

        Swal.fire({
            title: 'Simpan Opname?',
            text: "Stok sistem akan diperbarui sesuai data fisik.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Update Stok',
            confirmButtonColor: '#4f46e5',
        }).then((result) => {
            if (result.isConfirmed) {
                // Map data untuk dikirim ke backend
                data.items = allItems.map(item => ({
                    product_id: item.product_id,
                    actual_qty: item.physical_stock,
                    notes: item.notes // Kirim catatan juga
                }));

                post(route('stock-opnames.store'), {
                    onError: (err) => {
                        console.error(err);
                        const msg = Object.values(err)[0];
                        toast.error(msg || "Gagal menyimpan.");
                    }
                });
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Create Stock Opname" />
            <Toaster position="top-center" />

            <div className="py-6 max-w-[95%] mx-auto px-2 sm:px-6 lg:px-8">
                
                <div className="flex items-center justify-between mb-6">
                    <Link href={route('stock-opnames.index')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition">
                        <ArrowLeft className="w-5 h-5" /> Kembali
                    </Link>
                    <div className="text-right">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right">Nomor Opname</div>
                        <div className="font-mono font-bold text-slate-700">{newOpnameNumber}</div>
                    </div>
                </div>

                {/* --- UI SCANNER --- */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8 transition-all">
                    <div className={`px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 ${scanMode === 'warehouse' ? 'bg-slate-800' : 'bg-indigo-600'} text-white transition-colors duration-500`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                                {scanMode === 'warehouse' ? <MapPin className="w-8 h-8" /> : <ScanBarcode className="w-8 h-8" />}
                            </div>
                            <div>
                                <h2 className="font-bold text-2xl tracking-tight">
                                    {scanMode === 'warehouse' ? 'Pilih Lokasi Gudang' : 'Input Hasil Opname'}
                                </h2>
                                <p className="text-sm opacity-80 font-medium">
                                    {scanMode === 'warehouse' ? 'Scan barcode gudang.' : `Lokasi Aktif: ${scannedWarehouse?.name}`}
                                </p>
                            </div>
                        </div>

                        {scanMode === 'product' && (
                            <button 
                                onClick={() => {
                                    setScanMode('warehouse'); 
                                    setAllItems([]); 
                                    setFilteredItems([]);
                                    setScannedWarehouse(null);
                                    setData('warehouse_id', '');
                                }} 
                                className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-white/20"
                            >
                                <RefreshCw className="w-4 h-4" /> Ganti Lokasi
                            </button>
                        )}
                    </div>

                    <div className="p-10 bg-slate-50">
                        {scanMode === 'warehouse' ? (
                            <div className="max-w-xl mx-auto space-y-6">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full text-center text-3xl font-mono font-bold border-0 border-b-4 border-slate-300 bg-transparent focus:border-slate-800 focus:ring-0 py-4 transition placeholder:text-slate-300 uppercase"
                                    placeholder="SCAN GUDANG..."
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleScan}
                                />
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest">Atau pilih manual</p>
                                    <select 
                                        className="w-full border-slate-300 rounded-xl focus:ring-slate-500 focus:border-slate-500 text-center py-2"
                                        onChange={(e) => {
                                            const w = warehouses.find(x => x.id == e.target.value);
                                            if(w) selectWarehouse(w);
                                        }}
                                        value={data.warehouse_id}
                                    >
                                        <option value="">-- Pilih List Gudang --</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-4 max-w-4xl mx-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-5 top-4 w-6 h-6 text-slate-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="w-full pl-14 pr-4 py-3.5 rounded-2xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm text-xl font-bold placeholder:font-normal"
                                        placeholder="Scan Barcode / Ketik Nama Barang..."
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value)}
                                        onKeyDown={handleScan}
                                    />
                                </div>
                                <button onClick={resetFilter} className="px-6 py-3 bg-white border border-slate-300 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {isLoading && (
                    <div className="py-24 text-center animate-in fade-in">
                        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-700">Mengambil Data Stok...</h3>
                    </div>
                )}

                {!isLoading && data.warehouse_id && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex flex-col md:flex-row justify-between items-end px-2 gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
                                    <Package className="text-indigo-600 w-6 h-6" /> 
                                    {filteredItems.length !== allItems.length ? 'Hasil Pencarian' : 'Daftar Barang'}
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    Menampilkan {filteredItems.length} item.
                                </p>
                            </div>
                            <button onClick={handleSubmit} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50">
                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Simpan & Update Stok
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            {filteredItems.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-5 w-[25%]">Produk Info</th>
                                            <th className="px-6 py-5 text-center w-[10%]">Sistem</th>
                                            <th className="px-6 py-5 text-center bg-indigo-50 text-indigo-800 border-b-2 border-indigo-200 w-[15%]">Fisik (Edit)</th>
                                            <th className="px-6 py-5 text-center w-[10%]">Selisih</th>
                                            <th className="px-6 py-5 w-[40%]">Catatan Item</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.map((item) => (
                                            <tr key={item.product_id} className="hover:bg-slate-50/80 transition group">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="font-bold text-slate-800 text-base">{item.name}</div>
                                                    <div className="text-xs font-mono text-slate-400 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                        {item.sku}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <div className="font-mono font-bold text-slate-500 text-lg">{item.system_stock}</div>
                                                    <div className="text-[10px] text-slate-400">{item.unit}</div>
                                                </td>
                                                <td className="px-6 py-4 bg-indigo-50/20 align-top">
                                                    <div className="flex justify-center">
                                                        <input 
                                                            type="number"
                                                            className="w-24 text-center font-bold text-xl border-2 border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-indigo-700 py-2 shadow-sm"
                                                            value={item.physical_stock}
                                                            onChange={(e) => handlePhysicalChange(item.product_id, e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            min="0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center align-top">
                                                    <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-bold text-sm mt-2 ${
                                                        item.difference === 0 
                                                            ? 'text-slate-400 bg-slate-100' 
                                                            : item.difference > 0 
                                                                ? 'text-green-700 bg-green-100' 
                                                                : 'text-red-700 bg-red-100'
                                                    }`}>
                                                        {item.difference > 0 ? '+' : ''}{item.difference}
                                                    </span>
                                                </td>
                                                {/* --- INPUT CATATAN --- */}
                                                <td className="px-6 py-4 align-top">
                                                    <div className="relative">
                                                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                        <input 
                                                            type="text"
                                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-300 transition"
                                                            placeholder="Keterangan (opsional)..."
                                                            value={item.notes}
                                                            onChange={(e) => handleNotesChange(item.product_id, e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-16 text-center">
                                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-slate-800 font-bold text-lg">Tidak ada barang ditemukan</h3>
                                    <button onClick={resetFilter} className="text-indigo-600 font-bold hover:underline mt-2">
                                        Tampilkan Semua Barang
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}