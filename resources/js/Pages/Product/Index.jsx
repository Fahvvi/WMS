import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Package, Edit, Trash2, Eye, X, Warehouse, Printer, History } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function ProductIndex({ auth, products, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    
    // State untuk Modal Detail Stok
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('products.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Hapus Produk?',
            text: "Data yang dihapus tidak bisa dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('products.destroy', id));
            }
        });
    };

    // Fungsi Buka Modal
    const openStockModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Master Data Barang" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Package className="w-8 h-8 text-indigo-600" /> Data Barang (Inventory)
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">Kelola stok dan master data produk.</p>
                        </div>
                        {/* Link diperbaiki sesuai route settings */}
                        <Link href={route('settings.materials.create')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition">
                            <Plus className="w-5 h-5" /> Tambah Barang
                        </Link>
                    </div>

                    {/* Content Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        {/* Toolbar Search */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                    placeholder="Cari nama barang atau SKU..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    onKeyDown={handleSearch} 
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Produk Info</th>
                                        <th className="px-6 py-4 font-bold">Kategori</th>
                                        <th className="px-6 py-4 font-bold text-center">Total Stok</th>
                                        <th className="px-6 py-4 font-bold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.data.length > 0 ? (
                                        products.data.map((product) => {
                                            // Hitung Total Stok dari semua gudang
                                            const totalStock = product.stocks ? product.stocks.reduce((acc, stock) => acc + stock.quantity, 0) : 0;

                                            return (
                                                <tr key={product.id} className="hover:bg-slate-50 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800 text-base">{product.name}</div>
                                                        <div className="font-mono text-xs text-slate-500 mt-0.5 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                                            {product.sku}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                            {product.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`font-bold text-base ${totalStock > 0 ? 'text-slate-800' : 'text-red-500'}`}>
                                                            {totalStock}
                                                        </div>
                                                        <div className="text-xs text-slate-400">{product.unit}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {/* Tombol Lihat Stok (Detail) */}
                                                            <button 
                                                                onClick={() => openStockModal(product)} 
                                                                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                                                                title="Lihat Detail Stok per Gudang"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            {/* Tombol History */}
                                                            <Link href={route('products.history', product.id)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Riwayat Transaksi">
                                                                <History className="w-4 h-4" />
                                                            </Link>

                                                            {/* Tombol Print */}
                                                            <Link href={route('products.print', product.id)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Cetak Label">
                                                                <Printer className="w-4 h-4" />
                                                            </Link>

                                                            {/* Tombol Edit */}
                                                            <Link href={route('settings.materials.create', { search: product.sku, auto_edit: true })} className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition">
                                                                <Edit className="w-4 h-4" />
                                                            </Link>

                                                            {/* Tombol Hapus */}
                                                            <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Belum ada data barang.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {products.links && products.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-center">
                                <div className="flex gap-1">
                                    {products.links.map((link, i) => (
                                        link.url ? (
                                            <Link key={i} href={link.url} className={`px-3 py-1 text-sm rounded-md transition ${link.active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span key={i} className="px-3 py-1 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- MODAL DETAIL STOK --- */}
                {isModalOpen && selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{selectedProduct.name}</h3>
                                    <p className="text-xs text-slate-500 font-mono">{selectedProduct.sku}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-200 transition">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Modal Body (List Gudang) */}
                            <div className="p-0 max-h-[60vh] overflow-y-auto">
                                {(() => {
                                    // FILTER: Hanya tampilkan gudang yang stoknya > 0
                                    const activeStocks = selectedProduct.stocks ? selectedProduct.stocks.filter(s => s.quantity > 0) : [];

                                    if (activeStocks.length > 0) {
                                        return (
                                            <div className="divide-y divide-slate-100">
                                                {activeStocks.map((stock, idx) => (
                                                    <div key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                                <Warehouse className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-700">{stock.warehouse?.name || 'Unknown Warehouse'}</p>
                                                                <p className="text-xs text-slate-400">{stock.warehouse?.code}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-slate-800">{stock.quantity}</p>
                                                            <p className="text-[10px] uppercase text-slate-400 font-bold">{selectedProduct.unit}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {/* Total Row */}
                                                <div className="px-6 py-3 bg-indigo-50 flex justify-between items-center border-t border-indigo-100">
                                                    <span className="font-bold text-indigo-800 text-sm">TOTAL STOK</span>
                                                    <span className="font-bold text-indigo-800 text-lg">
                                                        {activeStocks.reduce((a, b) => a + b.quantity, 0)} {selectedProduct.unit}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="p-8 text-center text-slate-400">
                                                <Warehouse className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p>Stok Habis (0) di semua gudang.</p>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 flex justify-end">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}