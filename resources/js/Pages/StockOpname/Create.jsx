import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, MapPin, ScanBarcode, Save, Loader2, RefreshCw, Search, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function StockOpnameCreate({ auth, warehouses = [], newOpnameNumber }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    
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
            toast.success(t(`Data stok dimuat: ${mappedData.length} item.`), { id: 'opname-load' });
        } catch (error) {
            console.error(error);
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
        const results = allItems.filter(item => 
            item.sku.toLowerCase().includes(keyword) || 
            item.name.toLowerCase().includes(keyword)
        );

        if (results.length > 0) {
            setFilteredItems(results);
            toast.success(t(`${results.length} barang ditemukan.`));
        } else {
            toast.error(t('Barang tidak ditemukan.'));
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
        if(allItems.length === 0) return toast.error(t("Data stok kosong!"));

        Swal.fire({
            title: t('Simpan Opname?'),
            text: t("Stok sistem akan diperbarui sesuai data fisik."),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('Ya, Update Stok'),
            confirmButtonColor: '#4f46e5',
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                // Map data untuk dikirim ke backend
                data.items = allItems.map(item => ({
                    product_id: item.product_id,
                    actual_qty: item.physical_stock,
                    notes: item.notes 
                }));

                post(route('stock-opnames.store'), {
                    onError: (err) => {
                        console.error(err);
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
            <Toaster position="top-center" toastOptions={{
                className: 'dark:bg-slate-800 dark:text-white',
                style: { borderRadius: '12px' }
            }} />

            <div className="py-6 max-w-[95%] mx-auto px-2 sm:px-6 lg:px-8">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <Link href={route('stock-opnames.index')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="font-medium">{t('Kembali')}</span>
                    </Link>
                    <div className="text-left sm:text-right">
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{t('Nomor Opname')}</div>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{newOpnameNumber}</div>
                    </div>
                </div>

                {/* --- UI SCANNER AREA --- */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 transition-colors">
                    
                    {/* Header Scanner */}
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
                            <button 
                                onClick={() => {
                                    setScanMode('warehouse'); 
                                    setAllItems([]); 
                                    setFilteredItems([]);
                                    setScannedWarehouse(null);
                                    setData('warehouse_id', '');
                                }} 
                                className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-white/20 w-full md:w-auto justify-center"
                            >
                                <RefreshCw className="w-4 h-4" /> {t('Ganti Lokasi')}
                            </button>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 sm:p-10 bg-slate-50 dark:bg-slate-800/80 transition-colors">
                        {scanMode === 'warehouse' ? (
                            <div className="max-w-xl mx-auto space-y-6">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full text-center text-2xl sm:text-3xl font-mono font-bold border-0 border-b-4 border-slate-300 dark:border-slate-600 bg-transparent text-slate-800 dark:text-slate-100 focus:border-slate-800 dark:focus:border-slate-400 focus:ring-0 py-4 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600 uppercase"
                                    placeholder={t('SCAN GUDANG...')}
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleScan}
                                />
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{t('Atau pilih manual')}</p>
                                    <select 
                                        className="w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 text-center h-12 shadow-sm transition-colors"
                                        onChange={(e) => {
                                            const w = warehouses.find(x => x.id == e.target.value);
                                            if(w) selectWarehouse(w);
                                        }}
                                        value={data.warehouse_id}
                                    >
                                        <option value="">-- {t('Pilih List Gudang')} --</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-5 top-4 w-6 h-6 text-slate-400 dark:text-slate-500" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 shadow-sm text-lg sm:text-xl font-bold placeholder:font-normal transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        placeholder={t('Scan Barcode / Ketik Nama Barang...')}
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value)}
                                        onKeyDown={handleScan}
                                    />
                                </div>
                                <button onClick={resetFilter} className="px-6 py-3.5 h-[56px] sm:h-auto bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm w-full sm:w-auto">
                                    {t('Reset')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- LOADER --- */}
                {isLoading && (
                    <div className="py-24 text-center animate-in fade-in">
                        <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">{t('Mengambil Data Stok...')}</h3>
                    </div>
                )}

                {/* --- DATA STOK (HASIL PENCARIAN) --- */}
                {!isLoading && data.warehouse_id && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-2 gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xl">
                                    <Package className="text-indigo-600 dark:text-indigo-400 w-6 h-6" /> 
                                    {filteredItems.length !== allItems.length ? t('Hasil Pencarian') : t('Daftar Barang')}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    {t('Menampilkan')} {filteredItems.length} {t('item')}.
                                </p>
                            </div>
                            <button onClick={handleSubmit} disabled={processing} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50">
                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {t('Simpan & Update Stok')}
                            </button>
                        </div>

                        {/* DESAIN TABEL / KARTU RESPONSIVE */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                            {filteredItems.length > 0 ? (
                                <>
                                    {/* Versi Desktop (Table) */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left text-slate-600 dark:text-slate-300">
                                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-6 py-5 w-[25%]">{t('Produk Info')}</th>
                                                    <th className="px-6 py-5 text-center w-[10%]">{t('Sistem')}</th>
                                                    <th className="px-6 py-5 text-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-b-2 border-indigo-200 dark:border-indigo-800/50 w-[15%]">{t('Fisik (Edit)')}</th>
                                                    <th className="px-6 py-5 text-center w-[10%]">{t('Selisih')}</th>
                                                    <th className="px-6 py-5 w-[40%]">{t('Catatan Item')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {filteredItems.map((item) => (
                                                    <tr key={item.product_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition group">
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="font-bold text-slate-800 dark:text-slate-200 text-base">{item.name}</div>
                                                            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1 bg-slate-100 dark:bg-slate-900 inline-block px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                {item.sku}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center align-top">
                                                            <div className="font-mono font-bold text-slate-500 dark:text-slate-400 text-lg">{item.system_stock}</div>
                                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.unit}</div>
                                                        </td>
                                                        <td className="px-6 py-4 bg-indigo-50/20 dark:bg-indigo-900/10 align-top">
                                                            <div className="flex justify-center">
                                                                <input 
                                                                    type="number"
                                                                    className="w-24 text-center font-bold text-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 text-indigo-700 dark:text-indigo-400 py-2 shadow-sm transition-colors"
                                                                    value={item.physical_stock}
                                                                    onChange={(e) => handlePhysicalChange(item.product_id, e.target.value)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    min="0"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center align-top">
                                                            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg font-bold text-sm mt-2 border ${
                                                                item.difference === 0 
                                                                    ? 'text-slate-400 bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500' 
                                                                    : item.difference > 0 
                                                                        ? 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400' 
                                                                        : 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400'
                                                            }`}>
                                                                {item.difference > 0 ? '+' : ''}{item.difference}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="relative">
                                                                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                                <input 
                                                                    type="text"
                                                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
                                                                    placeholder={t('Keterangan (opsional)...')}
                                                                    value={item.notes}
                                                                    onChange={(e) => handleNotesChange(item.product_id, e.target.value)}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Versi Mobile (Card List) */}
                                    <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {filteredItems.map((item) => (
                                            <div key={item.product_id} className="p-4 space-y-4">
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                                                    <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1">SKU: {item.sku}</div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">{t('Sistem')}</div>
                                                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300 text-lg">{item.system_stock} <span className="text-xs font-normal">{item.unit}</span></div>
                                                    </div>
                                                    <div className="flex-1 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl border-2 border-indigo-100 dark:border-indigo-800/50 text-center">
                                                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold mb-1">{t('Fisik')}</div>
                                                        <input 
                                                            type="number"
                                                            className="w-full text-center font-bold text-xl border-0 bg-transparent focus:ring-0 text-indigo-700 dark:text-indigo-400 p-0"
                                                            value={item.physical_stock}
                                                            onChange={(e) => handlePhysicalChange(item.product_id, e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center">
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">{t('Selisih')}</div>
                                                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-sm border ${
                                                            item.difference === 0 
                                                                ? 'text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600' 
                                                                : item.difference > 0 
                                                                    ? 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400' 
                                                                    : 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400'
                                                        }`}>
                                                            {item.difference > 0 ? '+' : ''}{item.difference}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                                    <input 
                                                        type="text"
                                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 transition-colors"
                                                        placeholder={t('Catatan item ini...')}
                                                        value={item.notes}
                                                        onChange={(e) => handleNotesChange(item.product_id, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="p-16 text-center">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-600">
                                        <Search className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                                    </div>
                                    <h3 className="text-slate-800 dark:text-slate-200 font-bold text-lg">{t('Tidak ada barang ditemukan')}</h3>
                                    <button onClick={resetFilter} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-2">
                                        {t('Tampilkan Semua Barang')}
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