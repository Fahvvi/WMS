import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, MapPin, ScanBarcode, Save, X, Plus } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { useState, useRef, useEffect } from 'react';

export default function TransactionCreate({ auth, type, warehouses = [], newTrxNumber }) {
    const pageTitle = type === 'inbound' ? 'Inbound Scan (Masuk)' : 'Outbound Scan (Keluar)';
    
    // --- STATE SCANNER ---
    const [scanMode, setScanMode] = useState('warehouse'); // 'warehouse' atau 'product'
    const [scanInput, setScanInput] = useState('');
    const [scannedWarehouse, setScannedWarehouse] = useState(null);
    const inputRef = useRef(null); // Agar kursor selalu di input

    // --- STATE MODAL BARANG BARU ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', sku: '', unit: 'pcs' });
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    // --- FORM DATA UTAMA ---
    const { data, setData, post, processing, errors } = useForm({
        type: type,
        trx_number: newTrxNumber,
        trx_date: new Date().toISOString().split('T')[0],
        warehouse_id: '',
        items: [], // Item dimulai kosong
    });

    // Auto Focus ke input scanner setiap kali render
    useEffect(() => {
        if(inputRef.current) inputRef.current.focus();
    }, [scanMode, data.items, isModalOpen]);

    // --- LOGIC 1: HANDLE SCANNER (ENTER KEY) ---
    const handleScan = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Jangan submit form
            const code = scanInput.trim();
            if (!code) return;

            if (scanMode === 'warehouse') {
                processWarehouseScan(code);
            } else {
                await processProductScan(code);
            }
            setScanInput(''); // Kosongkan input setelah scan
        }
    };

    // --- LOGIC 2: PROSES SCAN GUDANG ---
    const processWarehouseScan = (code) => {
        // Cari gudang berdasarkan Code atau ID (Simulasi pencarian sederhana di array props)
        // Disini kita asumsikan user scan KODE GUDANG, misal "WH-001"
        const found = warehouses.find(w => w.code.toLowerCase() === code.toLowerCase() || w.name.toLowerCase().includes(code.toLowerCase()));
        
        if (found) {
            setScannedWarehouse(found);
            setData('warehouse_id', found.id);
            setScanMode('product'); // Pindah ke mode scan barang
            playBeep('success');
        } else {
            alert('Gudang tidak ditemukan! Pastikan scan Kode Gudang yang benar.');
            playBeep('error');
        }
    };

    // --- LOGIC 3: PROSES SCAN BARANG ---
    const processProductScan = async (code) => {
        try {
            // Cek ke Server via API
            const response = await window.axios.get(route('products.check', { code: code }));
            const result = response.data;

            if (result.status === 'found') {
                // BARANG DITEMUKAN -> TAMBAH QTY / LIST
                addItemToCart(result.product);
                playBeep('success');
            } else {
                // BARANG TIDAK DITEMUKAN -> BUKA MODAL BARU
                playBeep('error'); // Sound warning
                setNewProduct({ name: '', sku: code, unit: 'pcs' }); // Auto-fill SKU dengan hasil scan
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error(error);
            alert("Gagal koneksi ke server.");
        }
    };

    const addItemToCart = (product) => {
        const existingIdx = data.items.findIndex(item => item.product_id === product.id);
        const newItems = [...data.items];

        if (existingIdx >= 0) {
            // Barang sudah ada di list, tambah Qty
            newItems[existingIdx].quantity += 1;
        } else {
            // Barang baru di list
            newItems.unshift({ // Masukkan ke paling atas
                product_id: product.id,
                product_name: product.name, // Simpan nama buat display aja
                product_sku: product.sku,
                quantity: 1
            });
        }
        setData('items', newItems);
    };

    // --- LOGIC 4: SIMPAN BARANG BARU (DARI SCAN TIDAK DIKENAL) ---
    const handleQuickSave = async () => {
        if(!newProduct.name || !newProduct.unit) return alert("Lengkapi data!");
        
        setIsSavingProduct(true);
        try {
            const response = await window.axios.post(route('products.store'), newProduct);
            const savedProduct = response.data;
            
            // Langsung masukkan ke keranjang scan
            addItemToCart(savedProduct);
            
            setIsModalOpen(false);
            playBeep('success');
        } catch (error) {
            alert("Gagal menyimpan produk baru.");
        } finally {
            setIsSavingProduct(false);
        }
    };

    // Helper: Hapus item dari list
    const removeItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    // Helper: Beep Sound (Visual log di console, aslinya bisa pakai Audio API)
    const playBeep = (type) => {
        console.log(type === 'success' ? 'BEEP!' : 'BUZZ!');
        // Tips: Nanti bisa tambah new Audio('/beep.mp3').play();
    };

    // Submit Final Transaction
    const handleSubmit = (e) => {
        e.preventDefault();
        if(data.items.length === 0) return alert("Belum ada barang yang discan!");
        post(route('transactions.store'));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={pageTitle} />

            <div className="py-4 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* --- HEADER NAV --- */}
                <div className="flex items-center justify-between mb-4">
                    <Link href={route('transactions.index', { type })} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600">
                        <ArrowLeft className="w-5 h-5" /> Kembali
                    </Link>
                    <div className="font-mono font-bold text-slate-400">{newTrxNumber}</div>
                </div>

                {/* --- AREA SCANNER UTAMA --- */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-100 overflow-hidden mb-6">
                    {/* Status Bar */}
                    <div className={`px-6 py-3 flex justify-between items-center ${scanMode === 'warehouse' ? 'bg-orange-50' : 'bg-indigo-600'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${scanMode === 'warehouse' ? 'bg-orange-200 text-orange-700' : 'bg-white/20 text-white'}`}>
                                {scanMode === 'warehouse' ? <MapPin className="w-6 h-6" /> : <ScanBarcode className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className={`font-bold text-lg ${scanMode === 'warehouse' ? 'text-orange-900' : 'text-white'}`}>
                                    {scanMode === 'warehouse' ? 'Langkah 1: Scan Lokasi' : 'Langkah 2: Scan Barang'}
                                </h2>
                                <p className={`text-xs ${scanMode === 'warehouse' ? 'text-orange-700' : 'text-indigo-200'}`}>
                                    {scanMode === 'warehouse' ? 'Scan barcode rak / gudang...' : `Lokasi: ${scannedWarehouse?.name}`}
                                </p>
                            </div>
                        </div>
                        {/* Tombol Reset Gudang */}
                        {scanMode === 'product' && (
                            <button onClick={() => { setScanMode('warehouse'); setData('items', []); }} className="text-xs bg-black/20 text-white px-3 py-1 rounded hover:bg-black/30">
                                Ganti Lokasi
                            </button>
                        )}
                    </div>

                    {/* Input Field Besar (Invisible tapi Fokus) */}
                    <div className="p-8">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full text-center text-3xl font-mono font-bold border-2 border-slate-300 rounded-xl py-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition shadow-inner"
                                placeholder={scanMode === 'warehouse' ? "Scan Gudang..." : "Scan Produk..."}
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                onKeyDown={handleScan}
                                autoFocus
                            />
                            <div className="absolute right-4 top-4 text-slate-400 animate-pulse">
                                <ScanBarcode className="w-8 h-8" />
                            </div>
                        </div>
                        <p className="text-center text-slate-400 text-sm mt-3">
                            Arahkan scanner ke barcode atau ketik manual lalu Enter
                        </p>
                    </div>
                </div>

                {/* --- LIST HASIL SCAN (CART) --- */}
                {data.items.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Package className="w-5 h-5 text-indigo-600" /> 
                                Barang Ter-scan ({data.items.length})
                            </h3>
                            <button onClick={handleSubmit} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">
                                <Save className="w-4 h-4" /> Selesai & Simpan
                            </button>
                        </div>
                        
                        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                            {data.items.map((item, index) => (
                                <div key={index} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition animate-fade-in-down">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{item.product_name || 'Loading...'}</div>
                                            <div className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                                {item.product_sku}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Qty</span>
                                            <input 
                                                type="number" 
                                                className="w-20 text-center border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-indigo-500"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const newItems = [...data.items];
                                                    newItems[index].quantity = parseInt(e.target.value) || 0;
                                                    setData('items', newItems);
                                                }}
                                            />
                                        </div>
                                        <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- MODAL BARANG TIDAK DIKENAL --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-orange-500">
                            <div className="px-6 py-6 text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                                    <ScanBarcode className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-slate-900">Barang Tidak Dikenal</h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    Kode <strong>{newProduct.sku}</strong> belum ada di database. Silakan isi data singkat untuk mendaftarkannya sekarang.
                                </p>
                            </div>
                            
                            <div className="px-6 pb-6 space-y-4">
                                <div>
                                    <InputLabel value="SKU / Barcode (Otomatis)" />
                                    <TextInput 
                                        className="w-full mt-1 bg-slate-100 text-slate-500" 
                                        value={newProduct.sku} 
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Nama Produk" />
                                    <TextInput 
                                        className="w-full mt-1 border-orange-300 focus:ring-orange-500" 
                                        placeholder="Contoh: Baut 10mm"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                        autoFocus // Pindah fokus kesini saat modal muncul
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Satuan" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        value={newProduct.unit}
                                        onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Batal</button>
                                <button 
                                    onClick={handleQuickSave} 
                                    disabled={isSavingProduct}
                                    className="px-6 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-lg"
                                >
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