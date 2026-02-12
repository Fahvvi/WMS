import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, MapPin, ScanBarcode, Save, X, Camera, AlertCircle, RefreshCw } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { useState, useRef, useEffect } from 'react';
import BarcodeScanner from '@/Components/BarcodeScanner';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

export default function StockOpnameCreate({ auth, warehouses = [], nextNumber }) {
    const [scanMode, setScanMode] = useState('warehouse'); 
    const [scanInput, setScanInput] = useState('');
    const [scannedWarehouse, setScannedWarehouse] = useState(null);
    const inputRef = useRef(null); 
    const [showScanner, setShowScanner] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        opname_number: nextNumber,
        warehouse_id: '',
        notes: '',
        items: [], 
    });

    useEffect(() => {
        if(!showScanner && inputRef.current) inputRef.current.focus();
    }, [scanMode, data.items, showScanner]);

    const handleScan = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            const code = scanInput.trim();
            if (!code) return;

            if (scanMode === 'warehouse') {
                processWarehouseScan(code);
            } else {
                await processProductScan(code);
            }
            setScanInput(''); 
        }
    };

    const processWarehouseScan = (code) => {
        const found = warehouses.find(w => w.code.toLowerCase() === code.toLowerCase() || w.name.toLowerCase().includes(code.toLowerCase()));
        if (found) {
            setScannedWarehouse(found);
            setData('warehouse_id', found.id);
            setScanMode('product'); 
            toast.success(`Gudang: ${found.name}`);
        } else {
            Swal.fire('Error', 'Gudang tidak ditemukan!', 'error');
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
                addItemToCart(result.product, result.current_stock || 0);
                toast.success(`${result.product.name} ditemukan.`);
            } else {
                Swal.fire('Tidak Terdaftar', 'Produk tidak ditemukan di database.', 'warning');
            }
        } catch (error) {
            toast.error("Gagal koneksi ke server.");
        }
    };

    const addItemToCart = (product, systemStock) => {
        const existingIdx = data.items.findIndex(item => item.product_id === product.id);
        if (existingIdx >= 0) {
            toast('Barang sudah ada di daftar', { icon: 'ℹ️' });
            return;
        }

        const newItem = {
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            system_stock: systemStock,
            physical_stock: systemStock, // Default disamakan dulu
            difference: 0
        };

        setData('items', [newItem, ...data.items]);
    };

    const handlePhysicalChange = (index, value) => {
        const val = parseInt(value) || 0;
        const newItems = [...data.items];
        newItems[index].physical_stock = val;
        newItems[index].difference = val - newItems[index].system_stock;
        setData('items', newItems);
    };

    const removeItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(data.items.length === 0) return toast.error("Scan barang terlebih dahulu!");

        Swal.fire({
            title: 'Simpan Stock Opname?',
            text: "Stok di sistem akan langsung diperbarui sesuai angka fisik.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Update Stok!',
            confirmButtonColor: '#4f46e5',
        }).then((result) => {
            if (result.isConfirmed) {
                post(route('stock-opnames.store'));
            }
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Create Stock Opname" />

            <div className="py-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <Link href={route('stock-opnames.index')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition">
                        <ArrowLeft className="w-5 h-5" /> Kembali
                    </Link>
                    <div className="text-right">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider text-right">Nomor Opname</div>
                        <div className="font-mono font-bold text-slate-700">{nextNumber}</div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8 transition-all">
                    <div className={`px-8 py-4 flex justify-between items-center ${scanMode === 'warehouse' ? 'bg-slate-800' : 'bg-indigo-600'} text-white`}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                {scanMode === 'warehouse' ? <MapPin /> : <ScanBarcode />}
                            </div>
                            <div>
                                <h2 className="font-bold text-xl">{scanMode === 'warehouse' ? 'Scan Barcode Lokasi' : 'Scan Barcode Barang'}</h2>
                                <p className="text-sm opacity-80">{scanMode === 'warehouse' ? 'Tentukan gudang yang akan di-opname' : `Lokasi: ${scannedWarehouse?.name}`}</p>
                            </div>
                        </div>
                        {scanMode === 'product' && (
                            <button onClick={() => {setScanMode('warehouse'); setData('items', [])}} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Ganti Lokasi
                            </button>
                        )}
                    </div>

                    <div className="p-10">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full text-center text-4xl font-mono font-bold border-0 border-b-4 border-slate-200 focus:border-indigo-500 focus:ring-0 py-4 transition placeholder:text-slate-200"
                            placeholder={scanMode === 'warehouse' ? "SCAN LOKASI..." : "SCAN BARCODE BARANG..."}
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            onKeyDown={handleScan}
                        />
                    </div>
                </div>

                {data.items.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end px-2">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                                <Package className="text-indigo-600" /> Daftar Penyesuaian ({data.items.length})
                            </h3>
                            <button onClick={handleSubmit} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition active:scale-95">
                                <Save className="w-5 h-5" /> Simpan & Update Stok
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Informasi Produk</th>
                                        <th className="px-6 py-4 text-center">Stok Sistem</th>
                                        <th className="px-6 py-4 text-center">Stok Fisik</th>
                                        <th className="px-6 py-4 text-center">Selisih</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{item.name}</div>
                                                <div className="text-xs font-mono text-slate-400">{item.sku}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono font-bold text-slate-400 text-lg">
                                                {item.system_stock}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <input 
                                                        type="number"
                                                        className="w-24 text-center font-bold text-xl border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                                                        value={item.physical_stock}
                                                        onChange={(e) => handlePhysicalChange(index, e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-center font-bold text-lg ${item.difference === 0 ? 'text-slate-300' : item.difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                {item.difference > 0 ? `+${item.difference}` : item.difference}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => removeItem(index)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}