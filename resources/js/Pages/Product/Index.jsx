import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Package, Edit, Trash2, Eye, X, Warehouse, Printer, History, Download } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function ProductIndex({ auth, products, filters }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    
    // State untuk Modal Detail Stok
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Ambil permissions dari props auth
    const permissions = auth.permissions || [];

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('products.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: t('Hapus Produk?'),
            text: t("Data yang dihapus tidak bisa dikembalikan!"),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: t('Ya, Hapus!'),
            cancelButtonText: t('Batal'),
            // Tambahkan styling khusus untuk SweetAlert jika diinginkan di app.css, 
            // namun bawaan SweetAlert biasanya tetap menggunakan warna terang (light) by default.
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
            <Head title={t('Master Data Barang')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Package className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> {t('Data Barang (Inventory)')}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('Kelola stok dan master data produk.')}</p>
                        </div>
                        
                        {/* Tombol Tambah Barang */}
                        {permissions.includes('create_products') && (
                            <Link href={route('settings.materials.create')} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition">
                                <Plus className="w-5 h-5" /> {t('Tambah Barang')}
                            </Link>
                        )}
                    </div>

                    {/* Content Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
                        
                        {/* Toolbar Search & Export */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                            {/* Search Bar (Kiri) */}
                            <div className="relative max-w-md w-full md:w-96">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors" 
                                    placeholder={t('Cari nama barang atau SKU...')}
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    onKeyDown={handleSearch} 
                                />
                            </div>

                            {/* Tombol Export (Kanan) */}
                            {permissions.includes('export_products') && (
                                <a 
                                    href={route('products.export')} 
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm font-bold shadow-sm w-full md:w-auto justify-center"
                                >
                                    <Download className="w-4 h-4" /> {t('Export Excel')}
                                </a>
                            )}
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">{t('Produk Info')}</th>
                                        <th className="px-6 py-4 font-bold">{t('Kategori')}</th>
                                        <th className="px-6 py-4 font-bold text-center">{t('Total Stok')}</th>
                                        <th className="px-6 py-4 font-bold text-right">{t('Aksi')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                                    {products.data.length > 0 ? (
                                        products.data.map((product) => {
                                            // Hitung Total Stok dari semua gudang
                                            const totalStock = product.stocks ? product.stocks.reduce((acc, stock) => acc + stock.quantity, 0) : 0;

                                            return (
                                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200 text-base">{product.name}</div>
                                                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded w-fit border border-transparent dark:border-slate-700">
                                                            {product.sku}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50">
                                                            {product.category || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className={`font-bold text-base ${totalStock > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-red-500 dark:text-red-400'}`}>
                                                            {totalStock}
                                                        </div>
                                                        <div className="text-xs text-slate-400 dark:text-slate-500">{product.unit}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {/* Tombol Lihat Stok (Detail) */}
                                                            <button 
                                                                onClick={() => openStockModal(product)} 
                                                                className="p-2 text-indigo-500 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700"
                                                                title={t('Lihat Detail Stok per Gudang')}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            {/* Tombol History */}
                                                            <Link href={route('products.history', product.id)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 dark:hover:text-orange-400 rounded-lg transition border border-transparent hover:border-orange-200 dark:hover:border-orange-800" title={t('Riwayat Transaksi')}>
                                                                <History className="w-4 h-4" />
                                                            </Link>

                                                            {/* Tombol Print */}
                                                            <Link href={route('products.print', product.id)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition border border-transparent hover:border-blue-200 dark:hover:border-blue-800" title={t('Cetak Label')}>
                                                                <Printer className="w-4 h-4" />
                                                            </Link>

                                                            {/* Tombol Edit */}
                                                            {permissions.includes('edit_products') && (
                                                                <Link href={route('settings.materials.create', { search: product.sku, auto_edit: true })} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 rounded-lg transition border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800" title={t('Edit Produk')}>
                                                                    <Edit className="w-4 h-4" />
                                                                </Link>
                                                            )}

                                                            {/* Tombol Hapus */}
                                                            {permissions.includes('delete_products') && (
                                                                <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition border border-transparent hover:border-red-200 dark:hover:border-red-800" title={t('Hapus Produk')}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50">{t('Belum ada data barang.')}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {products.links && products.data.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-center bg-white dark:bg-slate-800 transition-colors">
                                <div className="flex gap-1 flex-wrap justify-center">
                                    {products.links.map((link, i) => (
                                        link.url ? (
                                            <Link 
                                                key={i} 
                                                href={link.url} 
                                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                                    link.active 
                                                    ? 'bg-indigo-600 text-white dark:bg-indigo-500' 
                                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`} 
                                                dangerouslySetInnerHTML={{ __html: link.label }} 
                                            />
                                        ) : (
                                            <span key={i} className="px-3 py-1 text-sm text-slate-300 dark:text-slate-600" dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- MODAL DETAIL STOK --- */}
                {isModalOpen && selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-slate-700 transition-colors">
                            
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{selectedProduct.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedProduct.sku}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Modal Body (List Gudang) */}
                            <div className="p-0 max-h-[60vh] overflow-y-auto">
                                {(() => {
                                    // FILTER: Hanya tampilkan gudang yang stoknya > 0
                                    const activeStocks = selectedProduct.stocks ? selectedProduct.stocks.filter(s => s.quantity > 0) : [];

                                    if (activeStocks.length > 0) {
                                        return (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {activeStocks.map((stock, idx) => (
                                                    <div key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                                <Warehouse className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{stock.warehouse?.name || t('Unknown Warehouse')}</p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-500">{stock.warehouse?.code}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{stock.quantity}</p>
                                                            <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold">{selectedProduct.unit}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {/* Total Row */}
                                                <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 flex justify-between items-center border-t border-indigo-100 dark:border-indigo-800/50">
                                                    <span className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">{t('TOTAL STOK')}</span>
                                                    <span className="font-bold text-indigo-800 dark:text-indigo-300 text-lg">
                                                        {activeStocks.reduce((a, b) => a + b.quantity, 0)} <span className="text-sm">{selectedProduct.unit}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                                                <Warehouse className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p>{t('Stok Habis (0) di semua gudang.')}</p>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-white dark:bg-slate-800">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-sm transition-colors">
                                    {t('Tutup')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}