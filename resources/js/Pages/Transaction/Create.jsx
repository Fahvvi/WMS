import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, MapPin, ScanBarcode, Save, X, Camera, Layers } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { useState, useRef, useEffect } from 'react';
import BarcodeScanner from '@/Components/BarcodeScanner';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import toast from 'react-hot-toast';
import { useLaravelReactI18n } from 'laravel-react-i18n';

const MySwal = withReactContent(Swal);

export default function TransactionCreate({ auth, type, warehouses = [], newTrxNumber, units = [], categories = [] }) {
    const { t } = useLaravelReactI18n();
    const pageTitle = type === 'inbound' ? t('Inbound Scan (Masuk)') : t('Outbound Scan (Keluar)');
    
    // --- STATE ---
    const [scanMode, setScanMode] = useState('warehouse'); 
    const [scanInput, setScanInput] = useState('');
    
    const [scannedWarehouse, setScannedWarehouse] = useState(null);
    const [scannedLocation, setScannedLocation] = useState(null); 
    
    const inputRef = useRef(null); 
    const [showScanner, setShowScanner] = useState(false);

    // Modal Product Baru
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', sku: '', barcode: '', unit: '', category: '' });
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    const { data, setData, post, processing } = useForm({
        type: type,
        trx_number: newTrxNumber,
        trx_date: new Date().toISOString().split('T')[0],
        warehouse_id: '',
        items: [], 
    });

    // Auto Focus
    useEffect(() => {
        if(!showScanner && !isModalOpen && inputRef.current) inputRef.current.focus();
    }, [scanMode, data.items, isModalOpen, showScanner, scannedLocation]);

    // --- AUDIO FEEDBACK ---
    const playAudio = (status) => {
        // Jika Anda memiliki file suara, letakkan di public/audio/
        // Jika tidak, biarkan try-catch ini menangani agar tidak error
        try {
            if (status === 'success') {
                // const audio = new Audio('/audio/beep-success.mp3');
                // audio.play();
            } else if (status === 'error') {
                // const audio = new Audio('/audio/beep-error.mp3');
                // audio.play();
            }
        } catch (e) {
            console.log("Audio not played.");
        }
    };

    // --- LOGIC SCAN ---
    const handleScan = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            const code = scanInput.trim();
            // Kosongkan input LANGSUNG di sini agar UX terasa cepat dan bersih
            setScanInput(''); 
            await processCode(code);
        }
    };

    const handleCameraScan = (decodedText) => {
        setShowScanner(false);
        setScanInput(''); // Kosongkan input
        processCode(decodedText);
    };

    const processCode = async (code) => {
        if (!code) return;

        if (scanMode === 'warehouse') {
            await processWarehouseScan(code);
        } else if (scanMode === 'location') {
            await processLocationScan(code);
        } else if (scanMode === 'product') {
            await processLocationOrProduct(code);
        }
    };

    const processWarehouseScan = async (code) => {
        const foundWh = warehouses.find(w => w.code.toLowerCase() === code.toLowerCase() || w.name.toLowerCase().includes(code.toLowerCase()));
        
        if (foundWh) {
            setScannedWarehouse(foundWh);
            setData('warehouse_id', foundWh.id);
            setScanMode('location'); 
            playAudio('success');
            toast.success(`${t('Gudang Terpilih')}: ${foundWh.name}`);
        } else {
            // Cek apakah user bypass langsung scan Rak?
            try {
                const response = await window.axios.get(route('transactions.locations.check', { code: code }));
                if (response.data.status === 'found') {
                    const loc = response.data.location;
                    const wh = response.data.warehouse;
                    
                    setScannedWarehouse(wh);
                    setData('warehouse_id', wh.id);
                    setScannedLocation(loc);
                    setScanMode('product'); 
                    playAudio('success');
                    toast.success(t(`Lokasi Terdeteksi: ${wh.name} > Rak ${loc.code}`));
                }
            } catch (error) {
                playAudio('error');
                toast.error(t('Barcode tidak dikenali sebagai Gudang maupun Rak.'));
            }
        }
    };

    const processLocationScan = async (code) => {
        try {
            const response = await window.axios.get(route('transactions.locations.check', { code: code }));

            if (response.data.status === 'found') {
                const loc = response.data.location;
                const wh = response.data.warehouse;

                if (wh.id !== data.warehouse_id) {
                    setScannedWarehouse(wh);
                    setData('warehouse_id', wh.id);
                    toast.success(t(`Gudang otomatis diganti ke: ${wh.name}`));
                }

                setScannedLocation(loc);
                setScanMode('product'); 
                playAudio('success');
                toast.success(`${t('Lokasi Aktif')}: ${loc.code}`);
            }
        } catch (error) {
            playAudio('error');
            MySwal.fire({
                icon: 'error',
                title: t('Lokasi Tidak Ditemukan'),
                text: t('Scan barcode Rak/Bin yang valid.'),
            });
        }
    };

    const processLocationOrProduct = async (code) => {
        // 1. PRIORITAS UTAMA: Cek sebagai PRODUK DULU
        try {
            const resProd = await window.axios.get(route('products.check', { 
                code: code, 
                warehouse_id: data.warehouse_id 
            }));

            if (resProd.data && resProd.data.status === 'found') {
                // BARANG DITEMUKAN! Masukkan keranjang & hentikan eksekusi
                addItemToCart(resProd.data.product, resProd.data.current_stock || 0);
                playAudio('success');
                toast.success(`${resProd.data.product.name} (+1)`, { icon: '📦' });
                return; // Return ini penting agar tidak lanjut cek ke rak
            }
        } catch (error) {
            // Error dari products.check diabaikan. Lanjut ke bawah.
        }

        // 2. PRIORITAS KEDUA: Jika BUKAN PRODUK, coba cek apakah user scan RAK baru?
        try {
            const resLoc = await window.axios.get(route('transactions.locations.check', { code: code }));

            if (resLoc.data && resLoc.data.status === 'found') {
                const loc = resLoc.data.location;
                const wh = resLoc.data.warehouse;

                if (wh.id !== data.warehouse_id) {
                    setScannedWarehouse(wh);
                    setData('warehouse_id', wh.id);
                    toast.success(t(`Gudang otomatis diganti ke: ${wh.name}`));
                }

                setScannedLocation(loc);
                playAudio('success');
                toast.success(`${t('Lokasi Aktif Pindah ke')}: ${loc.code}`);
                return; // Hentikan eksekusi
            }
        } catch (error) {
            // Error dari locations.check diabaikan. Lanjut ke bawah.
        }

        // 3. JIKA KEDUANYA GAGAL (Bukan Produk, Bukan Rak)
        playAudio('error');
        handleProductNotFound(code);
    };

    const handleProductNotFound = (code) => {
        const canCreateProduct = auth.permissions.includes('create_products') || 
                                 auth.user.roles.some(r => r.name === 'Super Admin');

        if (type === 'inbound') {
            if (canCreateProduct) {
                setNewProduct({ name: '', sku: code, barcode: code, unit: '', category: '' });
                setIsModalOpen(true);
            } else {
                MySwal.fire({ icon: 'error', title: t('Barang Tidak Terdaftar'), text: t('Kode belum ada di database.') });
            }
        } else {
            MySwal.fire({ icon: 'error', title: t('Barang Tidak Dikenal'), text: t('Kode tidak ada di database.') });
        }
    };

    const addItemToCart = (product, currentStock = 0) => {
        const locationId = scannedLocation ? scannedLocation.id : null;
        const existingIdx = data.items.findIndex(item => item.product_id === product.id && item.location_id === locationId);
        const newItems = [...data.items];

        if (existingIdx >= 0) {
            newItems[existingIdx].quantity += 1;
        } else {
            newItems.unshift({ 
                product_id: product.id, product_name: product.name, product_sku: product.sku, unit: product.unit,
                quantity: 1, stock_in_warehouse: currentStock,
                location_id: locationId, location_code: scannedLocation ? scannedLocation.code : t('Tanpa Rak')
            });
        }
        setData('items', newItems);
    };

    const handleQtyChange = (index, value) => {
        const newItems = [...data.items];
        newItems[index].quantity = parseInt(value) || 0;
        setData('items', newItems);
    };

    const removeItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
        toast(t('Item dihapus'));
    };

    const handleQuickSave = async () => {
        setIsSavingProduct(true);
        try {
            const response = await window.axios.post(route('products.store'), newProduct);
            addItemToCart(response.data, 0); 
            setIsModalOpen(false);
            MySwal.fire({ icon: 'success', title: t('Produk Dibuat!'), timer: 1000, showConfirmButton: false });
        } catch (e) { toast.error(t("Gagal menyimpan.")); } 
        finally { setIsSavingProduct(false); }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(data.items.length === 0) return toast.error(t("Scan barang terlebih dahulu!"));
        
        MySwal.fire({
            title: t('Simpan Transaksi?'),
            text: t(`Memproses ${data.items.length} item.`),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('Ya, Simpan!'),
            confirmButtonColor: '#4f46e5',
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('transactions.store'), {
                    preserveScroll: true,
                    // Karena backend mereturn redirect() saat sukses, 
                    // kita tidak perlu memunculkan alert sukses di sini agar tidak balapan dengan loading halaman baru
                    onSuccess: () => {
                        console.log("Redirecting..."); 
                    },
                    // [UPDATED] Tangkap SEMUA jenis error
                    onError: (err) => { 
                        console.error("Inertia Validation Errors:", err);
                        
                        // Ambil pesan error pertama dari object err
                        const errorMessage = Object.values(err)[0] || t('Terjadi kesalahan pada sistem/validasi.');
                        
                        MySwal.fire({
                            icon: 'error',
                            title: t('Gagal Menyimpan!'),
                            text: errorMessage
                        });
                    }
                });
            }
        });
    };

    // --- UI CONFIG ---
    const isInbound = type === 'inbound';
    const getHeaderColor = () => {
        if (scanMode === 'warehouse') return 'bg-slate-800 dark:bg-slate-900'; 
        if (scanMode === 'location') return 'bg-purple-600 dark:bg-purple-700'; 
        return isInbound ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-orange-600 dark:bg-orange-500'; 
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={pageTitle} />
            {showScanner && <BarcodeScanner onScanSuccess={handleCameraScan} onClose={() => setShowScanner(false)} />}

            <div className="py-4 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex items-center justify-between mb-4">
                    <Link href={route('transactions.index', { type })} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition">
                        <ArrowLeft className="w-5 h-5" /> {t('Kembali')}
                    </Link>
                    <div className="font-mono font-bold text-slate-400 dark:text-slate-500">{newTrxNumber}</div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 transition-all duration-300">
                    <div className={`px-6 py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 ${getHeaderColor()} text-white transition-colors duration-500`}>
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
                                {scanMode === 'warehouse' ? <MapPin className="w-6 h-6" /> : scanMode === 'location' ? <Layers className="w-6 h-6" /> : <ScanBarcode className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="font-bold text-lg leading-tight">
                                    {scanMode === 'warehouse' ? t('Langkah 1: Scan Lokasi Gudang / Rak') : scanMode === 'location' ? t('Langkah 2: Scan Rak / Bin') : t('Langkah 3: Scan Barang')}
                                </h2>
                                <div className="text-xs opacity-90 font-medium flex flex-wrap gap-2 mt-1">
                                    {scannedWarehouse && <span className="bg-black/20 px-2 py-0.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3" /> {scannedWarehouse.name}</span>}
                                    {scannedLocation && <span className="bg-white/20 px-2 py-0.5 rounded flex items-center gap-1 border border-white/30 text-white font-bold"><Layers className="w-3 h-3" /> {scannedLocation.code}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {scanMode !== 'warehouse' && (
                                <button onClick={() => { setScanMode('warehouse'); setScannedWarehouse(null); setScannedLocation(null); }} className="text-xs bg-black/20 hover:bg-black/30 text-white px-3 py-1.5 rounded-lg transition">
                                    {t('Ubah Gudang')}
                                </button>
                            )}
                            {scanMode === 'product' && (
                                <button onClick={() => { setScanMode('location'); setScannedLocation(null); }} className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition font-bold border border-white/30">
                                    {t('Ganti Rak')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="relative flex gap-3">
                            <div className="relative w-full">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full text-center text-2xl md:text-3xl font-mono font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-2xl py-4 transition-all shadow-inner focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                    placeholder={scanMode === 'warehouse' ? t('Scan Gudang atau Rak...') : scanMode === 'location' ? t('Scan Barcode Rak/Bin...') : t('Scan Produk / Lokasi Baru...')}
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleScan}
                                    autoFocus
                                />
                            </div>
                            <button onClick={() => setShowScanner(true)} className="flex-shrink-0 w-16 rounded-2xl border-2 flex md:hidden items-center justify-center border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"><Camera className="w-8 h-8" /></button>
                        </div>
                        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 italic">
                            {scanMode === 'warehouse' ? t('Tips: Anda bisa langsung scan barcode Rak untuk mempercepat proses.') : scanMode === 'product' ? t('Tips: Scan kode rak lain untuk pindah lokasi penyimpanan secara otomatis.') : t('Arahkan scanner ke barcode.')}
                        </p>
                        
                        {/* PILIHAN MANUAL DROP DOWN */}
                        {(scanMode === 'warehouse' || scanMode === 'location') && (
                            <div className="mt-6 text-center max-w-sm mx-auto">
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{t('Atau pilih manual')}</p>
                                
                                {scanMode === 'warehouse' && (
                                    <select 
                                        className="w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 text-center h-12 shadow-sm transition-colors"
                                        onChange={(e) => {
                                            const w = warehouses.find(x => x.id == e.target.value);
                                            if(w) {
                                                setScannedWarehouse(w);
                                                setData('warehouse_id', w.id);
                                                setScanMode('location');
                                            }
                                        }}
                                        value=""
                                    >
                                        <option value="">-- {t('Pilih List Gudang')} --</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                                    </select>
                                )}
                                
                                {scanMode === 'location' && scannedWarehouse && (
                                    <select 
                                        className="w-full border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-slate-500 focus:border-slate-500 text-center h-12 shadow-sm transition-colors"
                                        onChange={(e) => {
                                            if (e.target.value === 'SKIP') {
                                                setScannedLocation(null);
                                                setScanMode('product');
                                            } else if (e.target.value !== '') {
                                                processLocationScan(e.target.value);
                                            }
                                        }}
                                        value=""
                                    >
                                        <option value="">-- {t('Pilih Rak / Pilih Lewati')} --</option>
                                        <option value="SKIP" className="font-bold text-indigo-600">⏩ {t('Tanpa Rak / Lewati')}</option>
                                        {scannedWarehouse.locations?.map(loc => (
                                            <option key={loc.id} value={loc.code}>{loc.code} ({loc.type})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* LIST BARANG TER-SCAN */}
                {data.items.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Package className="w-5 h-5 text-indigo-500" /> {t('Daftar Barang')} ({data.items.length})
                            </h3>
                            <button onClick={handleSubmit} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition disabled:opacity-50">
                                {t('Simpan')}
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {data.items.map((item, index) => (
                                <div key={index} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/20 transition gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                                        <div className="h-12 w-12 shrink-0 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-lg">{index + 1}</div>
                                        <div className="overflow-hidden">
                                            <div className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">{item.product_name}</div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{item.product_sku}</span>
                                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${item.location_code !== t('Tanpa Rak') ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800/50' : 'text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700'}`}>
                                                    <Layers className="w-3 h-3" />{item.location_code}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden shadow-sm">
                                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Qty</div>
                                            <input type="number" className="w-20 text-center border-none bg-transparent focus:ring-0 font-bold text-lg py-1 text-slate-800 dark:text-white" value={item.quantity} min="1" onChange={(e) => handleQtyChange(index, e.target.value)} />
                                        </div>
                                        <button onClick={() => removeItem(index)} className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition"><X className="w-6 h-6" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MODAL BARANG TIDAK DIKENAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border-t-4 border-indigo-500 p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-4">{t('Barang Tidak Dikenal')}</h3>
                            <div className="space-y-4">
                                <div><InputLabel value={t('Nama Produk *')} className="dark:text-slate-300" /><TextInput className="w-full mt-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} autoFocus /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><InputLabel value={t('Kategori *')} className="dark:text-slate-300" /><TextInput className="w-full mt-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white" list="category-options" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} /><datalist id="category-options">{categories.map((c, i) => <option key={i} value={c.name} />)}</datalist></div>
                                    <div><InputLabel value={t('Satuan *')} className="dark:text-slate-300" /><TextInput className="w-full mt-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white" list="unit-options" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} /><datalist id="unit-options">{units.map((u, i) => <option key={i} value={u} />)}</datalist></div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">{t('Batal')}</button>
                                <button onClick={handleQuickSave} disabled={isSavingProduct} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50">{isSavingProduct ? t('Menyimpan...') : t('Simpan')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}