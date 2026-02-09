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

const MySwal = withReactContent(Swal);

export default function TransactionCreate({ auth, type, warehouses = [], newTrxNumber, units = [], categories = [] }) {
    const pageTitle = type === 'inbound' ? 'Inbound Scan (Masuk)' : 'Outbound Scan (Keluar)';
    
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
            toast.success(`Gudang Terpilih: ${found.name}`);
        } else {
            playAudio('error');
            MySwal.fire({
                icon: 'error',
                title: 'Gudang Tidak Ditemukan',
                text: 'Pastikan scan QR Code lokasi/gudang yang benar.',
            });
        }
    };

    const processProductScan = async (code) => {
        try {
            // Ambil data produk + stok di gudang yang dipilih
            const response = await window.axios.get(route('products.check', { 
                code: code,
                warehouse_id: data.warehouse_id 
            }));
            
            const result = response.data;

            if (result.status === 'found') {
                const product = result.product;
                const currentStock = result.current_stock || 0; 

                if (type === 'outbound') {
                    // Cek apakah barang sudah ada di list scan?
                    const existingItem = data.items.find(item => item.product_id === product.id);
                    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
                    
                    // VALIDASI STOK (Outbound tidak boleh melebihi stok)
                    if (currentQtyInCart + 1 > currentStock) {
                        playAudio('error');
                        MySwal.fire({
                            icon: 'warning',
                            title: 'Stok Tidak Cukup!',
                            html: `Stok <b>${product.name}</b> di gudang ini hanya sisa: <b class="text-red-600 text-lg">${currentStock}</b>.<br/>Anda sudah scan ${currentQtyInCart} pcs.`,
                        });
                        return; 
                    }
                }
                
                // Tambahkan ke Cart dengan info stok terakhir
                addItemToCart(product, currentStock);
                playAudio('success');
                toast.success(`${product.name} (+1)`);

            } else {
                playAudio('error'); 
                if (type === 'inbound') {
                    setNewProduct({ 
                        name: '', 
                        sku: code, 
                        barcode: code, 
                        unit: '', 
                        category: '' 
                    });
                    setIsModalOpen(true);
                } else {
                    MySwal.fire({
                        icon: 'error',
                        title: 'Barang Tidak Dikenal',
                        text: 'Kode barang ini tidak ada di database.',
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal koneksi ke server.");
        }
    };

    // UPDATE: Fungsi ini sekarang menerima parameter currentStock
    const addItemToCart = (product, currentStock = 0) => {
        const existingIdx = data.items.findIndex(item => item.product_id === product.id);
        const newItems = [...data.items];

        if (existingIdx >= 0) {
            newItems[existingIdx].quantity += 1;
            // Update info stok terbaru (jaga-jaga jika berubah, meski jarang)
            newItems[existingIdx].stock_in_warehouse = currentStock; 
        } else {
            newItems.unshift({ 
                product_id: product.id,
                product_name: product.name, 
                product_sku: product.sku,
                unit: product.unit,
                quantity: 1,
                // SIMPAN STOK GUDANG DI SINI UNTUK DITAMPILKAN
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
                toast.error(`Maksimal stok tersedia: ${maxStock}`);
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
            toast.error("Lengkapi Nama, Kategori, dan Satuan!");
            return;
        }
        setIsSavingProduct(true);
        try {
            const response = await window.axios.post(route('products.store'), newProduct);
            addItemToCart(response.data, 0); // Barang baru stoknya pasti 0
            setIsModalOpen(false);
            MySwal.fire({ icon: 'success', title: 'Produk Dibuat!', timer: 1500, showConfirmButton: false });
        } catch (error) {
            toast.error("Gagal menyimpan produk baru.");
        } finally {
            setIsSavingProduct(false);
        }
    };

    const removeItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
        toast('Item dihapus', { icon: '🗑️' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(data.items.length === 0) return toast.error("Scan barang terlebih dahulu!");
        
        MySwal.fire({
            title: 'Simpan Transaksi?',
            text: `Memproses ${data.items.length} item ${type === 'inbound' ? 'masuk' : 'keluar'}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan!',
            confirmButtonColor: type === 'inbound' ? '#4f46e5' : '#ea580c',
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('transactions.store'), {
                    onSuccess: () => MySwal.fire('Berhasil!', 'Transaksi disimpan.', 'success'),
                    onError: (errors) => {
                        if(errors.items) MySwal.fire({ icon: 'error', title: 'Gagal', text: errors.items });
                    }
                });
            }
        });
    };

    // --- UI CONFIG ---
    const isInbound = type === 'inbound';
    const mainBg = isInbound ? 'bg-indigo-600' : 'bg-orange-600';
    const mainHover = isInbound ? 'hover:bg-indigo-700' : 'hover:bg-orange-700';
    const accentText = isInbound ? 'text-indigo-600' : 'text-orange-600';
    const lightBg = isInbound ? 'bg-indigo-50' : 'bg-orange-50';
    const borderClass = isInbound ? 'border-indigo-100' : 'border-orange-100';
    const focusClass = isInbound ? 'focus:border-indigo-500 focus:ring-indigo-100' : 'focus:border-orange-500 focus:ring-orange-100';

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={pageTitle} />

            {showScanner && (
                <BarcodeScanner onScanSuccess={handleCameraScan} onClose={() => setShowScanner(false)} />
            )}

            <div className="py-4 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <Link href={route('transactions.index', { type })} className={`flex items-center gap-2 text-slate-500 ${accentText.replace('text', 'hover:text')}`}>
                        <ArrowLeft className="w-5 h-5" /> Kembali
                    </Link>
                    <div className="font-mono font-bold text-slate-400">{newTrxNumber}</div>
                </div>

                {/* SCANNER AREA */}
                <div className={`bg-white rounded-2xl shadow-lg border-2 ${borderClass} overflow-hidden mb-6 transition-all duration-300`}>
                    <div className={`px-6 py-3 flex justify-between items-center ${scanMode === 'warehouse' ? 'bg-slate-100' : mainBg}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${scanMode === 'warehouse' ? 'bg-white text-slate-500' : 'bg-white/20 text-white'}`}>
                                {scanMode === 'warehouse' ? <MapPin className="w-6 h-6" /> : <ScanBarcode className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className={`font-bold text-lg ${scanMode === 'warehouse' ? 'text-slate-700' : 'text-white'}`}>
                                    {scanMode === 'warehouse' ? 'Langkah 1: Scan Lokasi' : 'Langkah 2: Scan Barang'}
                                </h2>
                                <p className={`text-xs ${scanMode === 'warehouse' ? 'text-slate-500' : 'text-white/80'}`}>
                                    {scanMode === 'warehouse' ? 'Scan barcode rak / gudang...' : `Lokasi: ${scannedWarehouse?.name}`}
                                </p>
                            </div>
                        </div>
                        {scanMode === 'product' && (
                            <button onClick={() => { setScanMode('warehouse'); setData('items', []); }} className="text-xs bg-black/20 text-white px-3 py-1 rounded hover:bg-black/30">
                                Ganti Lokasi
                            </button>
                        )}
                    </div>

                    <div className="p-8">
                        <div className="relative flex gap-2">
                            <div className="relative w-full">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className={`w-full text-center text-3xl font-mono font-bold border-2 border-slate-300 rounded-xl py-4 transition shadow-inner ${focusClass}`}
                                    placeholder={scanMode === 'warehouse' ? "Scan Gudang..." : "Scan Produk..."}
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleScan}
                                    autoFocus
                                />
                            </div>
                            <button onClick={() => setShowScanner(true)} className={`flex-shrink-0 w-16 rounded-xl border-2 flex md:hidden items-center justify-center transition shadow-sm ${isInbound ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                                <Camera className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* LIST BARANG */}
                {data.items.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Package className={`w-5 h-5 ${accentText}`} /> Barang Ter-scan ({data.items.length})
                            </h3>
                            <button onClick={handleSubmit} disabled={processing} className={`${mainBg} ${mainHover} text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition`}>
                                <Save className="w-4 h-4" /> Selesai & Simpan
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                            {data.items.map((item, index) => (
                                <div key={index} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center hover:bg-slate-50 transition gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className={`h-12 w-12 shrink-0 ${lightBg} rounded-xl flex items-center justify-center ${accentText} font-bold text-lg`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-lg">{item.product_name}</div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    {item.product_sku}
                                                </span>
                                                
                                                {/* --- FITUR BARU: INFO STOK GUDANG --- */}
                                                {!isInbound && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Stok Gudang: {item.stock_in_warehouse} {item.unit}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                                            <div className="px-3 py-2 bg-slate-50 border-r border-slate-300 text-xs font-bold text-slate-500 uppercase">
                                                Qty
                                            </div>
                                            <input 
                                                type="number" 
                                                className={`w-20 text-center border-none focus:ring-0 font-bold text-slate-800 text-lg py-1 ${isInbound ? 'text-indigo-600' : 'text-orange-600'}`} 
                                                value={item.quantity} 
                                                min="1"
                                                // Jika outbound, set max sesuai stok
                                                max={!isInbound ? item.stock_in_warehouse : undefined}
                                                onChange={(e) => handleQtyChange(index, e.target.value)} 
                                            />
                                        </div>
                                        <button onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition">
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-indigo-500 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                                    <ScanBarcode className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-slate-900">Barang Tidak Dikenal</h3>
                                <p className="text-sm text-slate-500 mt-2">Kode <strong>{newProduct.sku}</strong> belum terdaftar.</p>
                            </div>
                            
                            <div className="px-6 pb-6 space-y-4">
                                <div><InputLabel value="SKU" /><TextInput className="w-full mt-1 bg-slate-100" value={newProduct.sku} readOnly /></div>
                                <div><InputLabel value="Nama Produk *" /><TextInput className="w-full mt-1" placeholder="Nama Barang" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} autoFocus /></div>
                                <div>
                                    <InputLabel value="Kategori *" />
                                    <TextInput className="w-full mt-1" list="category-options" placeholder="Pilih Kategori" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                                    <datalist id="category-options">{categories.map((c, i) => <option key={i} value={c.name} />)}</datalist>
                                </div>
                                <div>
                                    <InputLabel value="Satuan *" />
                                    <TextInput className="w-full mt-1" list="unit-options" placeholder="Pilih Satuan" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} />
                                    <datalist id="unit-options">{units.map((u, i) => <option key={i} value={u} />)}</datalist>
                                </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Batal</button>
                                <button onClick={handleQuickSave} disabled={isSavingProduct} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg">
                                    {isSavingProduct ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}