import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, MapPin, ScanBarcode, Save, Loader2, RefreshCw, Search, FileText, Layers } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { useLaravelReactI18n } from 'laravel-react-i18n'; 

export default function StockOpnameCreate({ auth, warehouses = [], newOpnameNumber }) {
    const { t } = useLaravelReactI18n(); 
    
    const [scanMode, setScanMode] = useState('warehouse'); 
    const [scanInput, setScanInput] = useState('');
    const [scannedWarehouse, setScannedWarehouse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [allItems, setAllItems] = useState([]); 
    const [filteredItems, setFilteredItems] = useState([]);

    const inputRef = useRef(null); 

    const { data, setData, post, processing } = useForm({
        opname_number: newOpnameNumber,
        opname_date: new Date().toISOString().split('T')[0],
        warehouse_id: '',
        notes: '', 
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
            toast.error(t('Gudang tidak ditemukan!'));
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
            
            // MAP DATA MENGGUNAKAN stock_id SEBAGAI KEY UNIK
            const mappedData = response.data.map(p => ({
                stock_id: p.stock_id,
                product_id: p.product_id,
                location_id: p.location_id,
                location_code: p.location_code,
                name: p.name,
                sku: p.sku,
                unit: p.unit,
                system_stock: p.system_qty,
                physical_stock: p.system_qty, 
                difference: 0,
                notes: '' 
            }));

            setAllItems(mappedData);
            setFilteredItems(mappedData);
            toast.success(t(`Data stok dimuat: ${mappedData.length} item rak.`), { id: 'opname-load' });
        } catch (error) {
            toast.error(t("Gagal mengambil data stok."));
            setScanMode('warehouse');
            setData('warehouse_id', '');
            setScannedWarehouse(null);
        } finally {
            setIsLoading(false);
        }
    };

    const processProductSearch = (code) => {
        const keyword = code.toLowerCase();
        // Cari berdasarkan SKU, Nama, atau Kode Rak
        const results = allItems.filter(item => 
            item.sku.toLowerCase().includes(keyword) || 
            item.name.toLowerCase().includes(keyword) ||
            item.location_code.toLowerCase().includes(keyword)
        );

        if (results.length > 0) {
            setFilteredItems(results);
            toast.success(t(`${results.length} titik stok ditemukan.`));
        } else {
            toast.error(t('Barang / Rak tidak ditemukan.'));
            setFilteredItems(allItems); 
        }
    };

    // UPDATE STATE BERDASARKAN stock_id, BUKAN product_id
    const handlePhysicalChange = (stockId, value) => {
        const val = parseInt(value) || 0;
        updateItemState(stockId, { 
            physical_stock: val, 
            difference: val - getItemSystemStock(stockId) 
        });
    };

    const handleNotesChange = (stockId, value) => {
        updateItemState(stockId, { notes: value });
    };

    const getItemSystemStock = (stockId) => {
        const item = allItems.find(i => i.stock_id === stockId);
        return item ? item.system_stock : 0;
    };

    const updateItemState = (stockId, newValues) => {
        const updater = (list) => list.map(item => 
            item.stock_id === stockId ? { ...item, ...newValues } : item
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
        if(allItems.length === 0) return toast.error(t("Data stok kosong!"));

        Swal.fire({
            title: t('Simpan Opname?'),
            text: t("Stok sistem akan diperbarui sesuai data fisik di setiap rak."),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('Ya, Update Stok'),
            confirmButtonColor: '#4f46e5',
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                // Map data untuk dikirim ke backend (sertakan location_id)
                data.items = allItems.map(item => ({
                    product_id: item.product_id,
                    location_id: item.location_id,
                    actual_qty: item.physical_stock,
                    notes: item.notes 
                }));

                post(route('stock-opnames.store'), {
                    onError: (err) => {
                        const msg = Object.values(err)[0];
                        toast.error(msg || t("Gagal menyimpan."));
                    }
                });
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={t('Create Stock Opname')} />
            <Toaster position="top-center" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white', style: { borderRadius: '12px' } }} />

            <div className="py-6 max-w-[95%] mx-auto px-2 sm:px-6 lg:px-8">
                
                {/* HEADER & UI SCANNER (Disembunyikan untuk menyingkat jawaban, Ganti dari template awal) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <Link href={route('stock-opnames.index')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:bg-indigo-50 border border-slate-200 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="font-medium">{t('Kembali')}</span>
                    </Link>
                    <div className="text-left sm:text-right">
                        <div className="text-xs text-slate-400 font-bold uppercase">{t('Nomor Opname')}</div>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{newOpnameNumber}</div>
                    </div>
                </div>

                {/* --- UI SCANNER AREA --- */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 transition-colors">
                    <div className={`px-4 sm:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${scanMode === 'warehouse' ? 'bg-slate-800 dark:bg-slate-900' : 'bg-indigo-600 dark:bg-indigo-500'} text-white transition-colors duration-500`}>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner shrink-0">
                                {scanMode === 'warehouse' ? <MapPin className="w-6 h-6 sm:w-8 sm:h-8" /> : <ScanBarcode className="w-6 h-6 sm:w-8 sm:h-8" />}
                            </div>
                            <div>
                                <h2 className="font-bold text-lg sm:text-2xl tracking-tight leading-tight">
                                    {scanMode === 'warehouse' ? t('Pilih Lokasi Gudang') : t('Input Hasil Opname')}
                                </h2>
                                <p className="text-xs sm:text-sm opacity-80 font-medium mt-0.5">
                                    {scanMode === 'warehouse' ? t('Scan barcode gudang.') : `${t('Lokasi Aktif')}: ${scannedWarehouse?.name}`}
                                </p>
                            </div>
                        </div>

                        {scanMode === 'product' && (
                            <button onClick={() => { setScanMode('warehouse'); setAllItems([]); setFilteredItems([]); setScannedWarehouse(null); setData('warehouse_id', ''); }} className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-white/20 w-full md:w-auto justify-center">
                                <RefreshCw className="w-4 h-4" /> {t('Ganti Lokasi')}
                            </button>
                        )}
                    </div>

                    <div className="p-6 sm:p-10 bg-slate-50 dark:bg-slate-800/80 transition-colors">
                        {scanMode === 'warehouse' ? (
                            <div className="max-w-xl mx-auto space-y-6">
                                <input ref={inputRef} type="text" className="w-full text-center text-2xl sm:text-3xl font-mono font-bold border-0 border-b-4 border-slate-300 bg-transparent focus:ring-0 py-4 dark:text-white" placeholder={t('SCAN GUDANG...')} value={scanInput} onChange={(e) => setScanInput(e.target.value)} onKeyDown={handleScan} />
                                <div className="text-center">
                                    <select className="w-full border-slate-300 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-slate-500 h-12 shadow-sm" onChange={(e) => { const w = warehouses.find(x => x.id == e.target.value); if(w) selectWarehouse(w); }} value={data.warehouse_id}>
                                        <option value="">-- {t('Pilih List Gudang')} --</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-5 top-4 w-6 h-6 text-slate-400" />
                                    <input ref={inputRef} type="text" className="w-full pl-14 pr-4 py-3.5 rounded-2xl dark:bg-slate-900 dark:text-white border-slate-300 text-lg sm:text-xl font-bold" placeholder={t('Scan Rak / Barcode / Ketik SKU...')} value={scanInput} onChange={(e) => setScanInput(e.target.value)} onKeyDown={handleScan} />
                                </div>
                                <button onClick={resetFilter} className="px-6 py-3.5 h-[56px] sm:h-auto bg-white dark:bg-slate-800 border border-slate-300 rounded-2xl font-bold dark:text-white w-full sm:w-auto">{t('Reset')}</button>
                            </div>
                        )}
                    </div>
                </div>

                {isLoading && (
                    <div className="py-24 text-center">
                        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
                        <h3 className="text-xl font-bold dark:text-white">{t('Mengambil Data Stok...')}</h3>
                    </div>
                )}

                {!isLoading && data.warehouse_id && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-2 gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xl">
                                    <Package className="text-indigo-600 w-6 h-6" /> {t('Daftar Barang Per Rak')}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">{t('Menampilkan')} {filteredItems.length} {t('titik stok')}.</p>
                            </div>
                            <button onClick={handleSubmit} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 w-full md:w-auto">
                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {t('Simpan & Update Stok')}
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            {filteredItems.length > 0 ? (
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-slate-600 dark:text-slate-300">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-bold uppercase border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-5 w-[30%]">{t('Produk & Rak')}</th>
                                                <th className="px-6 py-5 text-center w-[10%]">{t('Sistem')}</th>
                                                <th className="px-6 py-5 text-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 w-[15%]">{t('Fisik (Edit)')}</th>
                                                <th className="px-6 py-5 text-center w-[10%]">{t('Selisih')}</th>
                                                <th className="px-6 py-5 w-[35%]">{t('Catatan Item')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {filteredItems.map((item) => (
                                                <tr key={item.stock_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                                                        <div className="text-xs font-mono text-slate-400 mt-1">{item.sku}</div>
                                                        {/* BADGE RAK */}
                                                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50">
                                                            <Layers className="w-3 h-3" /> {item.location_code}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center align-top">
                                                        <div className="font-mono font-bold text-slate-500 text-lg">{item.system_stock}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase">{item.unit}</div>
                                                    </td>
                                                    <td className="px-6 py-4 bg-indigo-50/20 dark:bg-indigo-900/10 align-top">
                                                        <input 
                                                            type="number"
                                                            className="w-24 text-center font-bold text-xl border-2 border-slate-200 rounded-xl focus:ring-indigo-500 text-indigo-700 py-2 dark:bg-slate-900 dark:text-indigo-400 dark:border-slate-600"
                                                            value={item.physical_stock}
                                                            onChange={(e) => handlePhysicalChange(item.stock_id, e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-center align-top">
                                                        <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-bold text-sm mt-2 border ${
                                                            item.difference === 0 ? 'text-slate-400 bg-slate-100' : item.difference > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                                                        }`}>
                                                            {item.difference > 0 ? '+' : ''}{item.difference}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="relative">
                                                            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                            <input 
                                                                type="text"
                                                                className="w-full pl-9 pr-4 py-2 border-slate-200 rounded-lg text-sm dark:bg-slate-900 dark:text-white dark:border-slate-600"
                                                                placeholder={t('Keterangan (opsional)...')}
                                                                value={item.notes}
                                                                onChange={(e) => handleNotesChange(item.stock_id, e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-16 text-center">
                                    <h3 className="text-slate-800 dark:text-white font-bold text-lg">{t('Tidak ada barang ditemukan')}</h3>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}