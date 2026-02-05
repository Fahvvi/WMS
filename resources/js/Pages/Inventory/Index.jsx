import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, Plus, Package, Printer, Edit, Trash2, X, Save, 
    Filter, Download, MoreHorizontal, CheckSquare 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function InventoryIndex({ auth, products, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedIds, setSelectedIds] = useState([]); // Untuk fitur checkbox masa depan
    
    // --- STATE MODAL EDIT/CREATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form Hook (Inertia)
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        sku: '',
        barcode: '',
        unit: '',
        category: '',
        min_stock_alert: 5
    });

    // Handle Search
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('products.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    // Buka Modal (Create)
    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingProduct(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    // Buka Modal (Edit)
    const openEditModal = (product) => {
        setIsEditMode(true);
        setEditingProduct(product);
        setData({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || '',
            unit: product.unit,
            category: product.category || '',
            min_stock_alert: product.min_stock_alert
        });
        clearErrors();
        setIsModalOpen(true);
    };

    // Submit Form
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('products.update', editingProduct.id), {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            post(route('products.store'), {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    // Handle Delete
    const handleDelete = (product) => {
        if (confirm(`HAPUS PERMANEN?\n\nProduk: ${product.name}\nSKU: ${product.sku}\n\nPerhatian: Data stok dan riwayat transaksi mungkin akan ikut terhapus atau error.`)) {
            destroy(route('products.destroy', product.id));
        }
    };

    // Toggle Checkbox
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
                    <h2 className="font-bold text-xl text-slate-800 leading-tight flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-700" /> Master Inventory
                    </h2>
                    
                    {/* Action Buttons Top */}
                    <div className="flex gap-2">
                        <button className="px-3 py-2 bg-white border border-slate-300 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm">
                            <Download className="w-4 h-4" /> Export Excel
                        </button>
                        <button 
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-indigo-700 text-white rounded-md text-xs font-bold hover:bg-indigo-800 flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Tambah Produk
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Inventory" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-[100%] mx-auto">
                
                {/* --- FILTER BAR (Enterprise Style) --- */}
                <div className="bg-white p-3 border border-slate-200 border-b-0 rounded-t-lg flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative">
                            <input
                                type="text"
                                className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 w-64 shadow-sm placeholder:text-slate-400"
                                placeholder="Search SKU / Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                        </div>
                        <button className="p-2 border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600 bg-white shadow-sm" title="Filter Lanjutan">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                        Menampilkan {products.data.length} data dari total {products.total}
                    </div>
                </div>

                {/* --- DATA GRID TABLE (Dense & Bordered) --- */}
                <div className="bg-white border border-slate-300 overflow-x-auto shadow-sm">
                    <table className="w-full text-sm text-left text-slate-600">
                        {/* Header Table */}
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-300">
                            <tr>
                                <th scope="col" className="p-3 w-10 border-r border-slate-300 text-center">
                                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-0" />
                                </th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300">SKU Code</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300">Product Name</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300">Barcode</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300">Category</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 text-center">Unit</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 text-right">Min. Stock</th>
                                <th scope="col" className="px-4 py-3 border-r border-slate-300 text-right bg-indigo-50/50">Total Qty</th>
                                <th scope="col" className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        
                        {/* Body Table */}
                        <tbody className="divide-y divide-slate-200">
                            {products.data.length > 0 ? (
                                products.data.map((product, index) => (
                                    <tr key={product.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                        <td className="p-3 text-center border-r border-slate-200">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-0" 
                                                checked={selectedIds.includes(product.id)}
                                                onChange={() => toggleSelect(product.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 font-mono font-bold text-indigo-700 whitespace-nowrap">
                                            {product.sku}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 font-medium text-slate-800">
                                            {product.name}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 font-mono text-xs text-slate-500">
                                            {product.barcode || '-'}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-slate-600">
                                            {product.category || '-'}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-center text-xs uppercase">
                                            {product.unit}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-right font-mono">
                                            {product.min_stock_alert}
                                        </td>
                                        <td className={`px-4 py-2 border-r border-slate-200 text-right font-bold bg-indigo-50/30 ${
                                            (product.stocks_sum_quantity || 0) <= product.min_stock_alert ? 'text-red-600' : 'text-slate-800'
                                        }`}>
                                            {product.stocks_sum_quantity || 0}
                                        </td>
                                        <td className="px-4 py-2 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link 
                                                    href={route('products.print', product.id)} 
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-200 transition"
                                                    title="Print Label"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => openEditModal(product)} 
                                                    className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded border border-transparent hover:border-orange-200 transition"
                                                    title="Edit Data"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product)} 
                                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition"
                                                    title="Hapus Data"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-slate-400 bg-slate-50">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        Data produk tidak ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION (Footer Table) --- */}
                <div className="bg-white border border-t-0 border-slate-300 rounded-b-lg p-3 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        Halaman {products.current_page} dari {products.last_page}
                    </div>
                    <div className="flex gap-1">
                        {products.links.map((link, k) => (
                             link.url ? (
                                <Link 
                                    key={k} 
                                    href={link.url} 
                                    className={`px-3 py-1 text-xs font-medium rounded border ${
                                        link.active 
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : null
                        ))}
                    </div>
                </div>

                {/* --- MODAL FORM (Create/Edit) --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                            {/* Modal Header */}
                            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    {isEditMode ? <Edit className="w-5 h-5 text-orange-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                                    {isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <InputLabel value="Nama Produk *" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        value={data.name} 
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Laptop ASUS ROG"
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value="SKU / Part No *" />
                                        <TextInput 
                                            className="w-full mt-1 bg-slate-50 font-mono" 
                                            value={data.sku} 
                                            onChange={(e) => setData('sku', e.target.value)}
                                            placeholder="SKU-001"
                                        />
                                        <InputError message={errors.sku} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Barcode" />
                                        <TextInput 
                                            className="w-full mt-1" 
                                            value={data.barcode} 
                                            onChange={(e) => setData('barcode', e.target.value)}
                                            placeholder="Auto generate..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value="Kategori" />
                                        <TextInput 
                                            className="w-full mt-1" 
                                            value={data.category} 
                                            onChange={(e) => setData('category', e.target.value)}
                                            placeholder="Electronics"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Satuan *" />
                                        <TextInput 
                                            className="w-full mt-1" 
                                            value={data.unit} 
                                            onChange={(e) => setData('unit', e.target.value)}
                                            placeholder="Pcs, Unit, Box"
                                        />
                                        <InputError message={errors.unit} className="mt-1" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel value="Minimum Stock Alert" />
                                    <TextInput 
                                        type="number" 
                                        className="w-full mt-1" 
                                        value={data.min_stock_alert} 
                                        onChange={(e) => setData('min_stock_alert', e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Sistem akan memberi warning jika stok di bawah angka ini.</p>
                                </div>

                                {/* Modal Footer */}
                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold">Batal</button>
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className={`px-6 py-2 text-white font-bold rounded-lg shadow-md flex items-center gap-2 text-sm transition ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    >
                                        <Save className="w-4 h-4" /> {isEditMode ? 'Simpan Perubahan' : 'Simpan Produk'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}