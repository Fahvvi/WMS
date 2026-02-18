import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, Package, Printer, History, 
    Filter, Download 
} from 'lucide-react';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function InventoryIndex({ auth, products, filters }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedIds, setSelectedIds] = useState([]);

    // Handle Search
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('products.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    // Toggle Checkbox (Fitur seleksi baris)
    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="font-bold text-xl text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-700 dark:text-indigo-400" /> 
                        {t('Master Inventory')}
                    </h2>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-sm transition-colors">
                            <Download className="w-4 h-4" /> {t('Export Excel')}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={t('Inventory')} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-[100%] mx-auto">
                
                {/* --- FILTER BAR --- */}
                <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 border-b-0 rounded-t-lg flex flex-wrap gap-3 items-center justify-between transition-colors">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative">
                            <input
                                type="text"
                                className="pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-slate-100 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 w-64 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                                placeholder={t('Search SKU / Name...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                        </div>
                        <button className="p-2 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 shadow-sm transition-colors" title={t('Filter Lanjutan')}>
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {t('Menampilkan')} {products.data.length} {t('data dari total')} {products.total}
                    </div>
                </div>

                {/* --- DATA GRID TABLE --- */}
                <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-x-auto shadow-sm transition-colors">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        {/* Header Table */}
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700/50 border-b border-slate-300 dark:border-slate-600">
                            <tr>
                                <th scope="col" className="p-3 w-10 border-r border-slate-300 dark:border-slate-600 text-center">
                                    <input type="checkbox" className="rounded border-slate-300 dark:border-slate-500 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500" />
                                </th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 dark:border-slate-600">{t('SKU Code')}</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 dark:border-slate-600">{t('Product Name')}</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 dark:border-slate-600">{t('Barcode')}</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 dark:border-slate-600">{t('Category')}</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 dark:border-slate-600 text-center">{t('Unit')}</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 dark:border-slate-600 text-right">{t('Min. Stock')}</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 dark:border-slate-600 text-right bg-indigo-50/50 dark:bg-indigo-900/20">{t('Total Qty')}</th>
                                <th scope="col" className="px-4 py-3 text-center">{t('Actions')}</th>
                            </tr>
                        </thead>
                        
                        {/* Body Table */}
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80">
                            {products.data.length > 0 ? (
                                products.data.map((product, index) => (
                                    <tr key={product.id} className={`hover:bg-blue-50 dark:hover:bg-indigo-900/20 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/30 dark:bg-slate-800/50'}`}>
                                        <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/80">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 dark:border-slate-500 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                                                checked={selectedIds.includes(product.id)}
                                                onChange={() => toggleSelect(product.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-700/80 font-mono font-bold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                                            {product.sku}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-700/80 font-medium text-slate-800 dark:text-slate-200">
                                            {product.name}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-700/80 font-mono text-xs text-slate-500 dark:text-slate-400">
                                            {product.barcode || '-'}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300">
                                            {product.category || '-'}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-700/80 text-center text-xs uppercase dark:text-slate-300">
                                            {product.unit}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-700/80 text-right font-mono dark:text-slate-300">
                                            {product.min_stock_alert}
                                        </td>
                                        <td className={`px-4 py-2 border-r border-slate-200 dark:border-slate-700/80 text-right font-bold bg-indigo-50/30 dark:bg-indigo-900/10 ${
                                            (product.stocks_sum_quantity || 0) <= product.min_stock_alert ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'
                                        }`}>
                                            {product.stocks_sum_quantity || 0}
                                        </td>
                                        <td className="px-4 py-2 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* TOMBOL 1: PRINT LABEL */}
                                                <Link 
                                                    href={route('products.print', product.id)} 
                                                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700 transition"
                                                    title={t('Print Label')}
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Link>
                                                
                                                {/* TOMBOL 2: HISTORY */}
                                                <Link 
                                                    href={route('products.history', product.id)} 
                                                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded border border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition"
                                                    title={t('Lihat History Transaksi')}
                                                >
                                                    <History className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        {t('Data produk tidak ditemukan.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION (Footer Table) --- */}
                <div className="bg-white dark:bg-slate-800 border border-t-0 border-slate-300 dark:border-slate-700 rounded-b-lg p-3 flex justify-between items-center transition-colors">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t('Halaman')} {products.current_page} {t('dari')} {products.last_page}
                    </div>
                    <div className="flex gap-1">
                        {products.links.map((link, k) => (
                             link.url ? (
                                <Link 
                                    key={k} 
                                    href={link.url} 
                                    className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                                        link.active 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400' 
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : null
                        ))}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}