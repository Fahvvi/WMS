import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Package, MapPin, ScanBarcode, Save, X, Camera } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { useState, useRef, useEffect } from 'react';
import BarcodeScanner from '@/Components/BarcodeScanner';

// IMPORT LIBRARY BARU
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import toast from 'react-hot-toast';

const MySwal = withReactContent(Swal);

export default function TransactionCreate({ auth, type, warehouses = [], newTrxNumber, units = [], categories = [] }) {
    const pageTitle = type === 'inbound' ? 'Inbound Scan (Masuk)' : 'Outbound Scan (Keluar)';
    
    // --- STATE SCANNER ---
    const [scanMode, setScanMode] = useState('warehouse'); 
    const [scanInput, setScanInput] = useState('');
    const [scannedWarehouse, setScannedWarehouse] = useState(null);
    const inputRef = useRef(null); 

    // --- STATE KAMERA HP ---
    const [showScanner, setShowScanner] = useState(false);

    // --- STATE MODAL BARANG BARU ---
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

    // --- EFFECT: AUDIO BEEP ---
    const playAudio = (type) => {
        // Opsional: Anda bisa menambahkan file audio beep.mp3 di folder public
        // const audio = new Audio(type === 'success' ? '/audio/beep.mp3' : '/audio/error.mp3');
        // audio.play().catch(e => console.log(e));
    };

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
            toast.success(`Gudang Terpilih: ${found.name}`); // TOAST SUKSES
        } else {
            playAudio('error');
            // SWEETALERT ERROR
            MySwal.fire({
                icon: 'error',
                title: 'Gudang Tidak Ditemukan',
                text: 'Pastikan Anda men-scan QR Code lokasi/gudang yang benar.',
                confirmButtonColor: '#ef4444',
            });
        }
    };

    const processProductScan = async (code) => {
        try {
            // KIRIM warehouse_id SAAT CEK BARANG
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
                    
                    // VALIDASI STOK PER GUDANG (SweetAlert)
                    if (currentQtyInCart + 1 > currentStock) {
                        playAudio('error');
                        MySwal.fire({
                            icon: 'warning',
                            title: 'GAGAL OUTBOUND!',
                            html: `
                                <div class="text-left bg-red-50 p-4 rounded-lg border border-red-100">
                                    <p class="font-bold text-slate-700">${product.name}</p>
                                    <p class="text-sm text-slate-500 mt-1">Stok di <b>${scannedWarehouse?.name}</b> hanya sisa: <b class="text-red-600 text-lg">${currentStock} ${product.unit}</b></p>
                                    <p class="text-xs text-slate-400 mt-2">Tidak bisa mengambil lebih dari stok tersedia.</p>
                                </div>
                            `,
                            confirmButtonText: 'Oke, Mengerti',
                            confirmButtonColor: '#334155',
                        });
                        return; 
                    }
                }
                addItemToCart(product);
                playAudio('success');
                toast.success(`${product.name} (+1)`, { position: 'bottom-center' }); // Toast kecil di bawah

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
                    // SweetAlert Error Outbound Barang Asing
                    MySwal.fire({
                        icon: 'error',
                        title: 'Barang Tidak Dikenal',
                        text: 'Kode barang ini tidak ada di database. Tidak bisa melakukan Outbound.',
                        footer: `Kode Scanned: ${code}`
                    });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Gagal koneksi ke server.");
        }
    };

    const addItemToCart = (product) => {
        const existingIdx = data.items.findIndex(item => item.product_id === product.id);
        const newItems = [...data.items];

        if (existingIdx >= 0) {
            newItems[existingIdx].quantity += 1;
        } else {
            newItems.unshift({ 
                product_id: product.id,
                product_name: product.name, 
                product_sku: product.sku,
                quantity: 1
            });
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
            addItemToCart(response.data);
            setIsModalOpen(false);
            
            // SweetAlert Sukses Barang Baru
            MySwal.fire({
                icon: 'success',
                title: 'Produk Dibuat!',
                text: `${newProduct.name} berhasil ditambahkan ke database dan list inbound.`,
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan produk baru.");
        } finally {
            setIsSavingProduct(false);
        }
    };

    const removeItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
        toast('Item dihapus dari list', { icon: '🗑️' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(data.items.length === 0) return toast.error("Scan barang terlebih dahulu!");
        
        // SweetAlert Konfirmasi Submit
        MySwal.fire({
            title: 'Simpan Transaksi?',
            text: `Anda akan memproses ${data.items.length} item ${type === 'inbound' ? 'masuk' : 'keluar'}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: type === 'inbound' ? '#4f46e5' : '#ea580c',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Ya, Simpan!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('transactions.store'), {
                    onSuccess: () => {
                        MySwal.fire(
                            'Berhasil!',
                            'Transaksi telah disimpan.',
                            'success'
                        );
                    },
                    onError: (errors) => {
                        // Handle error validasi dari backend (misal stok tiba-tiba habis)
                        if(errors.items) {
                            MySwal.fire({
                                icon: 'error',
                                title: 'Gagal Menyimpan',
                                text: errors.items, // Pesan error dari TransactionController
                            });
                        }
                    }
                });
            }
        });
    };

    // --- THEME ---
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

            {/* KAMERA */}
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
                <div className={`bg-white rounded-2xl shadow-lg border-2 ${borderClass} overflow-hidden mb-6`}>
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
                                <div className="absolute right-4 top-4 text-slate-400 animate-pulse hidden md:block">
                                    <ScanBarcode className="w-8 h-8" />
                                </div>
                            </div>
                            <button onClick={() => setShowScanner(true)} className={`flex-shrink-0 w-16 rounded-xl border-2 flex md:hidden items-center justify-center transition shadow-sm ${isInbound ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                                <Camera className="w-8 h-8" />
                            </button>
                        </div>
                        <p className="text-center text-slate-400 text-sm mt-3">Ketik manual, Scan Alat, atau Gunakan Kamera HP</p>
                    </div>
                </div>

                {/* LIST BARANG */}
                {data.items.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                                <div key={index} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 ${lightBg} rounded-lg flex items-center justify-center ${accentText} font-bold`}>{index + 1}</div>
                                        <div>
                                            <div className="font-bold text-slate-800">{item.product_name || 'Loading...'}</div>
                                            <div className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">{item.product_sku}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Qty</span>
                                            <input type="number" className={`w-20 text-center border-slate-200 rounded-lg font-bold text-slate-800 ${focusClass.split(' ')[0]}`} value={item.quantity} onChange={(e) => { const newItems = [...data.items]; newItems[index].quantity = parseInt(e.target.value) || 0; setData('items', newItems); }} />
                                        </div>
                                        <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full"><X className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- MODAL BARANG TIDAK DIKENAL (Inbound Only) --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-indigo-500 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                                    <ScanBarcode className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-slate-900">Barang Tidak Dikenal</h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    Kode <strong>{newProduct.sku}</strong> belum ada di database.
                                </p>
                            </div>
                            
                            <div className="px-6 pb-6 space-y-4">
                                <div>
                                    <InputLabel value="SKU / Barcode Scanned" />
                                    <TextInput className="w-full mt-1 bg-slate-100 text-slate-500 font-mono" value={newProduct.sku} readOnly />
                                </div>
                                <div>
                                    <InputLabel value="Nama Produk *" />
                                    <TextInput className="w-full mt-1 border-indigo-300 focus:ring-indigo-500" placeholder="Contoh: Baut 10mm" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} autoFocus />
                                </div>
                                <div>
                                    <InputLabel value="Kategori *" />
                                    <TextInput className="w-full mt-1" list="category-options" placeholder="Pilih Kategori..." value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                                    <datalist id="category-options">{categories.map((c, i) => (<option key={i} value={c.name} />))}</datalist>
                                </div>
                                <div>
                                    <InputLabel value="Satuan *" />
                                    <TextInput className="w-full mt-1" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} list="unit-options" placeholder="Pilih Satuan..." autoComplete="off" />
                                    <datalist id="unit-options">{units.map((u, i) => (<option key={i} value={u} />))}</datalist>
                                </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Batal</button>
                                <button onClick={handleQuickSave} disabled={isSavingProduct} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg flex items-center gap-2">
                                    {isSavingProduct ? 'Menyimpan...' : 'Simpan & Masukkan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}