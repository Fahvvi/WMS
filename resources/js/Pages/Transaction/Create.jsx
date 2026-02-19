import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, MapPin, ScanBarcode, Save, X, Camera, AlertTriangle } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { useState, useRef, useEffect } from 'react';
import BarcodeScanner from '@/Components/BarcodeScanner';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import toast from 'react-hot-toast';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

const MySwal = withReactContent(Swal);

export default function TransactionCreate({ auth, type, warehouses = [], newTrxNumber, units = [], categories = [] }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    const pageTitle = type === 'inbound' ? t('Inbound Scan (Masuk)') : t('Outbound Scan (Keluar)');
    
    // --- STATE ---
    const [scanMode, setScanMode] = useState('warehouse'); 
    const [scanInput, setScanInput] = useState('');
    const [scannedWarehouse, setScannedWarehouse] = useState(null);
    const inputRef = useRef(null); 
    const [showScanner, setShowScanner] = useState(false);

    // Modal Product Baru
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', sku: '', barcode: '', unit: '', category: '' });
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        type: type,
        trx_number: newTrxNumber,
        trx_date: new Date().toISOString().split('T')[0],
        warehouse_id: '',
        items: [], 
    });

    const playAudio = (type) => {
        // Placeholder audio feedback
    };

    // Auto Focus
    useEffect(() => {
        if(!showScanner && !isModalOpen && inputRef.current) inputRef.current.focus();
    }, [scanMode, data.items, isModalOpen, showScanner]);

    // --- LOGIC HANDLE SCAN ---
    const handleScan = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            const code = scanInput.trim();
            processCode(code);
        }
    };

    const handleCameraScan = (decodedText) => {
        setShowScanner(false);
        setScanInput(decodedText);
        processCode(decodedText);
    };

    const processCode = async (code) => {
        if (!code) return;

        if (scanMode === 'warehouse') {
            processWarehouseScan(code);
        } else {
            await processProductScan(code);
        }
        setScanInput(''); 
    };

    const processWarehouseScan = (code) => {
        const found = warehouses.find(w => w.code.toLowerCase() === code.toLowerCase() || w.name.toLowerCase().includes(code.toLowerCase()));
        
        if (found) {
            setScannedWarehouse(found);
            setData('warehouse_id', found.id);
            setScanMode('product'); 
            playAudio('success');
            toast.success(`${t('Gudang Terpilih')}: ${found.name}`);
        } else {
            playAudio('error');
            MySwal.fire({
                icon: 'error',
                title: t('Gudang Tidak Ditemukan'),
                text: t('Pastikan scan QR Code lokasi/gudang yang benar.'),
            });
        }
    };

    const processProductScan = async (code) => {
        try {
            const response = await window.axios.get(route('products.check', { 
                code: code,
                warehouse_id: data.warehouse_id 
            }));
            
            const result = response.data;

            if (result.status === 'found') {
                const product = result.product;
                const currentStock = result.current_stock || 0; 
                if (type === 'outbound') {
                    const existingItem = data.items.find(item => item.product_id === product.id);
                    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
                    if (currentQtyInCart + 1 > currentStock) {
                        playAudio('error');
                        MySwal.fire({ icon: 'warning', title: t('Stok Tidak Cukup!'), html: t(`Stok <b>${product.name}</b>...`) });
                        return; 
                    }
                }
                addItemToCart(product, currentStock);
                playAudio('success');
                toast.success(`${product.name} (+1)`);

            } else {
                // --- LOGIKA BARU UNTUK BARANG TIDAK DITEMUKAN ---
                playAudio('error'); 

                // Ambil data permission dari props auth
                const canCreateProduct = auth.permissions.includes('create_products') || 
                                         auth.user.roles.some(r => r.name === 'Super Admin');

                if (type === 'inbound') {
                    if (canCreateProduct) {
                        // Jika punya izin, tampilkan modal buat produk baru
                        setNewProduct({ 
                            name: '', 
                            sku: code, 
                            barcode: code, 
                            unit: '', 
                            category: '' 
                        });
                        setIsModalOpen(true);
                    } else {
                        // Jika TIDAK punya izin, tampilkan pesan peringatan saja
                        MySwal.fire({
                            icon: 'error',
                            title: t('Barang Tidak Terdaftar'),
                            text: t('Kode barang ini belum ada di database. Silakan hubungi Supervisor atau Admin untuk mendaftarkan barang baru.'),
                            confirmButtonColor: '#4f46e5'
                        });
                    }
                } else {
                    // Jika Outbound dan barang tidak ada
                    MySwal.fire({
                        icon: 'error',
                        title: t('Barang Tidak Dikenal'),
                        text: t('Kode barang ini tidak ada di database.'),
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(t("Gagal koneksi ke server."));
        }
    };

    const addItemToCart = (product, currentStock = 0) => {
        const existingIdx = data.items.findIndex(item => item.product_id === product.id);
        const newItems = [...data.items];

        if (existingIdx >= 0) {
            newItems[existingIdx].quantity += 1;
            newItems[existingIdx].stock_in_warehouse = currentStock; 
        } else {
            newItems.unshift({ 
                product_id: product.id,
                product_name: product.name, 
                product_sku: product.sku,
                unit: product.unit,
                quantity: 1,
                stock_in_warehouse: currentStock 
            });
        }
        setData('items', newItems);
    };

    const handleQtyChange = (index, value) => {
        const newItems = [...data.items];
        const val = parseInt(value) || 0;
        
        // Validasi Outbound saat edit manual input qty
        if (type === 'outbound') {
            const maxStock = newItems[index].stock_in_warehouse;
            if (val > maxStock) {
                toast.error(`${t('Maksimal stok tersedia')}: ${maxStock}`);
                newItems[index].quantity = maxStock; // Kembalikan ke max
            } else {
                newItems[index].quantity = val;
            }
        } else {
            newItems[index].quantity = val;
        }
        
        setData('items', newItems);
    };

    const handleQuickSave = async () => {
        if(!newProduct.name || !newProduct.unit || !newProduct.category) {
            toast.error(t("Lengkapi Nama, Kategori, dan Satuan!"));
            return;
        }
        setIsSavingProduct(true);
        try {
            const response = await window.axios.post(route('products.store'), newProduct);
            addItemToCart(response.data, 0); // Barang baru stoknya pasti 0
            setIsModalOpen(false);
            MySwal.fire({ icon: 'success', title: t('Produk Dibuat!'), timer: 1500, showConfirmButton: false });
        } catch (error) {
            toast.error(t("Gagal menyimpan produk baru."));
        } finally {
            setIsSavingProduct(false);
        }
    };

    const removeItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
        toast(t('Item dihapus'), { icon: '🗑️', style: { background: '#333', color: '#fff' } });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(data.items.length === 0) return toast.error(t("Scan barang terlebih dahulu!"));
        
        MySwal.fire({
            title: t('Simpan Transaksi?'),
            text: t(`Memproses ${data.items.length} item ${type === 'inbound' ? 'masuk' : 'keluar'}.`),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('Ya, Simpan!'),
            cancelButtonText: t('Batal'),
            confirmButtonColor: type === 'inbound' ? '#4f46e5' : '#ea580c',
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('transactions.store'), {
                    onSuccess: () => MySwal.fire(t('Berhasil!'), t('Transaksi disimpan.'), 'success'),
                    onError: (errors) => {
                        if(errors.items) MySwal.fire({ icon: 'error', title: t('Gagal'), text: errors.items });
                    }
                });
            }
        });
    };

    // --- UI CONFIG ---
    const isInbound = type === 'inbound';
    
    // Light Mode Colors
    const mainBg = isInbound ? 'bg-indigo-600' : 'bg-orange-600';
    const mainHover = isInbound ? 'hover:bg-indigo-700' : 'hover:bg-orange-700';
    const accentText = isInbound ? 'text-indigo-600' : 'text-orange-600';
    const lightBg = isInbound ? 'bg-indigo-50' : 'bg-orange-50';
    const borderClass = isInbound ? 'border-indigo-100' : 'border-orange-100';
    const focusClass = isInbound ? 'focus:border-indigo-500 focus:ring-indigo-100' : 'focus:border-orange-500 focus:ring-orange-100';
    
    // Dark Mode Colors
    const darkMainBg = isInbound ? 'dark:bg-indigo-500' : 'dark:bg-orange-500';
    const darkMainHover = isInbound ? 'dark:hover:bg-indigo-600' : 'dark:hover:bg-orange-600';
    const darkAccentText = isInbound ? 'dark:text-indigo-400' : 'dark:text-orange-400';
    const darkLightBg = isInbound ? 'dark:bg-indigo-900/30' : 'dark:bg-orange-900/30';
    const darkBorderClass = isInbound ? 'dark:border-indigo-800/50' : 'dark:border-orange-800/50';
    const darkFocusClass = isInbound ? 'dark:focus:border-indigo-400' : 'dark:focus:border-orange-400';

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={pageTitle} />

            {showScanner && (
                <BarcodeScanner onScanSuccess={handleCameraScan} onClose={() => setShowScanner(false)} />
            )}

            <div className="py-4 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <Link href={route('transactions.index', { type })} className={`flex items-center gap-2 text-slate-500 dark:text-slate-400 ${accentText.replace('text', 'hover:text')} ${darkAccentText.replace('text', 'hover:text')} transition-colors`}>
                        <ArrowLeft className="w-5 h-5" /> {t('Kembali')}
                    </Link>
                    <div className="font-mono font-bold text-slate-400 dark:text-slate-500">{newTrxNumber}</div>
                </div>

                {/* SCANNER AREA */}
                <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 ${borderClass} ${darkBorderClass} overflow-hidden mb-6 transition-all duration-300`}>
                    <div className={`px-6 py-4 flex justify-between items-center ${scanMode === 'warehouse' ? 'bg-slate-100 dark:bg-slate-700/50' : `${mainBg} ${darkMainBg}`}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${scanMode === 'warehouse' ? 'bg-white dark:bg-slate-600 text-slate-500 dark:text-slate-300 shadow-sm' : 'bg-white/20 text-white'}`}>
                                {scanMode === 'warehouse' ? <MapPin className="w-6 h-6" /> : <ScanBarcode className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className={`font-bold text-lg ${scanMode === 'warehouse' ? 'text-slate-700 dark:text-slate-200' : 'text-white'}`}>
                                    {scanMode === 'warehouse' ? t('Langkah 1: Scan Lokasi') : t('Langkah 2: Scan Barang')}
                                </h2>
                                <p className={`text-xs ${scanMode === 'warehouse' ? 'text-slate-500 dark:text-slate-400' : 'text-white/80'}`}>
                                    {scanMode === 'warehouse' ? t('Scan barcode rak / gudang...') : `${t('Lokasi')}: ${scannedWarehouse?.name}`}
                                </p>
                            </div>
                        </div>
                        {scanMode === 'product' && (
                            <button onClick={() => { setScanMode('warehouse'); setData('items', []); }} className="text-xs font-bold bg-black/20 text-white px-3 py-1.5 rounded-lg hover:bg-black/30 transition-colors">
                                {t('Ganti Lokasi')}
                            </button>
                        )}
                    </div>

                    <div className="p-8">
                        <div className="relative flex gap-3">
                            <div className="relative w-full">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className={`w-full text-center text-3xl font-mono font-bold bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-2xl py-4 transition-all shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 ${focusClass} ${darkFocusClass}`}
                                    placeholder={scanMode === 'warehouse' ? t('Scan Gudang...') : t('Scan Produk...')}
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleScan}
                                    autoFocus
                                />
                            </div>
                            {/* Tombol Kamera untuk Mobile */}
                            <button 
                                onClick={() => setShowScanner(true)} 
                                className={`flex-shrink-0 w-16 rounded-2xl border-2 flex md:hidden items-center justify-center transition-colors shadow-sm ${isInbound ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:text-indigo-400' : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-400'}`}
                            >
                                <Camera className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* LIST BARANG TER-SCAN */}
                {data.items.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/30">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Package className={`w-5 h-5 ${accentText} ${darkAccentText}`} /> {t('Barang Ter-scan')} ({data.items.length})
                            </h3>
                            <button onClick={handleSubmit} disabled={processing} className={`${mainBg} ${mainHover} ${darkMainBg} ${darkMainHover} text-white px-6 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2 transition disabled:opacity-50`}>
                                <Save className="w-4 h-4" /> <span className="hidden sm:inline">{t('Selesai & Simpan')}</span><span className="sm:hidden">{t('Simpan')}</span>
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {data.items.map((item, index) => (
                                <div key={index} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/20 transition gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                                        <div className={`h-12 w-12 shrink-0 ${lightBg} ${darkLightBg} rounded-xl flex items-center justify-center ${accentText} ${darkAccentText} font-bold text-lg`}>
                                            {index + 1}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">{item.product_name}</div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                    {item.product_sku}
                                                </span>
                                                
                                                {/* FITUR INFO STOK GUDANG */}
                                                {!isInbound && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-800/50">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {t('Stok Gudang')}: {item.stock_in_warehouse} {item.unit}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden shadow-sm">
                                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                Qty
                                            </div>
                                            <input 
                                                type="number" 
                                                className={`w-20 text-center border-none bg-transparent focus:ring-0 font-bold text-lg py-1 ${accentText} ${darkAccentText}`} 
                                                value={item.quantity} 
                                                min="1"
                                                max={!isInbound ? item.stock_in_warehouse : undefined}
                                                onChange={(e) => handleQtyChange(index, e.target.value)} 
                                            />
                                        </div>
                                        <button onClick={() => removeItem(index)} className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors" title={t('Hapus Item')}>
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MODAL BARANG TIDAK DIKENAL (Inbound Only) */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-indigo-500 dark:border-indigo-400 animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mb-4">
                                    <ScanBarcode className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('Barang Tidak Dikenal')}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('Kode')} <strong className="text-slate-700 dark:text-slate-300 font-mono">{newProduct.sku}</strong> {t('belum terdaftar.')}</p>
                            </div>
                            
                            <div className="px-6 pb-6 space-y-4">
                                <div>
                                    <InputLabel value={t('SKU')} className="dark:text-slate-300" />
                                    <TextInput className="w-full mt-1 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed rounded-xl font-mono" value={newProduct.sku} readOnly />
                                </div>
                                <div>
                                    <InputLabel value={t('Nama Produk *')} className="dark:text-slate-300" />
                                    <TextInput className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" placeholder={t('Nama Barang')} value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} autoFocus />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value={t('Kategori *')} className="dark:text-slate-300" />
                                        <TextInput className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" list="category-options" placeholder={t('Pilih Kategori')} value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                                        <datalist id="category-options">{categories.map((c, i) => <option key={i} value={c.name} />)}</datalist>
                                    </div>
                                    <div>
                                        <InputLabel value={t('Satuan *')} className="dark:text-slate-300" />
                                        <TextInput className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" list="unit-options" placeholder={t('Pilih Satuan')} value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} />
                                        <datalist id="unit-options">{units.map((u, i) => <option key={i} value={u} />)}</datalist>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 px-6 py-4 flex gap-3 justify-end">
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">{t('Batal')}</button>
                                <button onClick={handleQuickSave} disabled={isSavingProduct} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md flex items-center gap-2 transition-colors disabled:opacity-50">
                                    <Save className="w-4 h-4" /> {isSavingProduct ? t('Menyimpan...') : t('Simpan')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}