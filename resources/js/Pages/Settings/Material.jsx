import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, Package, Filter, 
    Folder, FolderOpen, ChevronRight, Save, X, 
    Edit, Printer, Trash2, MoreHorizontal, 
    ChevronsLeft, ChevronsRight // Icon untuk Buka/Tutup Toolbar
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import Swal from 'sweetalert2';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function MaterialIndex({ materials, categories, units, currentCategory, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categorySearch, setCategorySearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State untuk Mobile Menu & Desktop Toolbar
    // Kita pakai satu state ID untuk melacak baris mana yang sedang "aktif" (Toolbar terbuka)
    const [activeRowId, setActiveRowId] = useState(null); 
    const actionRef = useRef(null);

    // State untuk Edit Mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '', sku: '', barcode: '', unit: '', category: currentCategory || '', min_stock_alert: 5
    });

    // Close menu on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (actionRef.current && !actionRef.current.contains(event.target)) {
                setActiveRowId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Logic
    const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.materials.create'), { category: currentCategory, search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    const selectCategory = (catName) => {
        router.get(route('settings.materials.create'), { category: catName === currentCategory ? null : catName, search: searchTerm }, { preserveState: true });
    };

    // Actions
    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        reset(); // Bersihkan form
        if(currentCategory) setData('category', currentCategory);
        clearErrors();
        setIsModalOpen(true);
        setActiveRowId(null); // Tutup toolbar
    };

    const openEditModal = (item) => {
        setIsEditMode(true);
        setEditingId(item.id);
        
        // FIX: Pastikan data terisi lengkap dari item yang dipilih
        setData({
            name: item.name,
            sku: item.sku || '', // Handle jika null
            barcode: item.barcode || '',
            unit: item.unit,
            category: item.category || '',
            min_stock_alert: item.min_stock_alert
        });
        
        clearErrors();
        setIsModalOpen(true);
        setActiveRowId(null); // Tutup toolbar setelah klik edit
    };

    const handleDelete = (item) => {
        Swal.fire({
            title: 'Hapus Material?',
            html: `Anda akan menghapus material <b>"${item.name}"</b>.<br/><span style="font-size:12px; color:red">Stok terkait di gudang mungkin akan error!</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('products.destroy', item.id), {
                    onSuccess: () => {
                        // Toast otomatis muncul dari Layout, tapi kalau mau SweetAlert lagi boleh:
                        Swal.fire(
                            'Terhapus!',
                            'Material telah dihapus.',
                            'success'
                        );
                        // Reset toolbar
                        setActiveRowId(null);
                    }
                });
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('products.update', editingId), { onSuccess: () => setIsModalOpen(false) });
        } else {
            post(route('products.store'), { onSuccess: () => setIsModalOpen(false) });
        }
    };

    return (
        <SettingsLayout title="Material Master Data">
            <div className="flex h-[calc(100vh-10rem)] gap-4">
                
                {/* --- SIDEBAR KIRI --- */}
                <div className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden hidden md:flex">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-indigo-600" /> Kategori
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white" 
                                placeholder="Filter..." 
                                value={categorySearch} 
                                onChange={(e) => setCategorySearch(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button onClick={() => selectCategory(null)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${!currentCategory ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <FolderOpen className="w-4 h-4" /> Semua Material
                        </button>
                        {filteredCategories.map((cat) => (
                            <button key={cat.id} onClick={() => selectCategory(cat.name)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition group ${currentCategory === cat.name ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
                                <div className="flex items-center gap-2">
                                    <Folder className={`w-4 h-4 ${currentCategory === cat.name ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                                    <span className="truncate max-w-[140px] text-left">{cat.name}</span>
                                </div>
                                {currentCategory === cat.name && <ChevronRight className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- KONTEN KANAN --- */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder={`Cari material...`} 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                onKeyDown={handleSearch} 
                            />
                        </div>
                        <button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2">
                            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Material Baru</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto pb-20 md:pb-0">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                                <tr>
                                    <th className="px-4 py-3 border-r border-slate-200 w-12 text-center">No</th>
                                    <th className="px-4 py-3 border-r border-slate-200">SKU / ID</th>
                                    <th className="px-4 py-3 border-r border-slate-200">Nama Material</th>
                                    <th className="px-4 py-3 border-r border-slate-200 hidden md:table-cell">Kategori</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-center">Satuan</th>
                                    <th className="px-4 py-3 border-r border-slate-200 hidden md:table-cell">Barcode</th>
                                    <th className="px-4 py-3 text-center w-28">:</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {materials.data.length > 0 ? (
                                    materials.data.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-indigo-50/30 transition group relative">
                                            <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-400 font-mono text-xs">
                                                {materials.from + index}
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 font-mono font-bold text-indigo-700 text-xs select-all">
                                                {item.sku}
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 font-medium text-slate-800">
                                                {item.name}
                                                <div className="md:hidden text-xs text-slate-400 mt-0.5">{item.category}</div>
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 hidden md:table-cell">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                                                    {item.category || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 text-center text-xs">
                                                {item.unit}
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 hidden md:table-cell font-mono text-xs text-slate-500 select-all">
                                                {item.barcode || item.sku}
                                            </td>
                                            
                                            {/* --- KOLOM AKSI (Dark Toolbar) --- */}
                                            <td className="px-4 py-2 text-center relative">
                                                
                                                {/* 1. Tombol Trigger (Buka) */}
                                                {activeRowId !== item.id && (
                                                    <div className="flex justify-center">
                                                        {/* Desktop: Muncul saat Hover */}
                                                        <button 
                                                            onClick={() => setActiveRowId(item.id)}
                                                            className="hidden md:flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition opacity-0 group-hover:opacity-100"
                                                        >
                                                            <ChevronsLeft className="w-4 h-4" /> Aksi
                                                        </button>
                                                        {/* Mobile: Selalu muncul */}
                                                        <button 
                                                            onClick={() => setActiveRowId(activeRowId === item.id ? null : item.id)}
                                                            className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                                                        >
                                                            <MoreHorizontal className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* 2. Toolbar Aktif (Expanded) */}
                                                {activeRowId === item.id && (
                                                    <div 
                                                        ref={actionRef}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center bg-slate-800 rounded-lg shadow-2xl py-1 px-1.5 animate-in fade-in zoom-in-95 duration-200 border border-slate-700"
                                                    >
                                                        {/* Edit */}
                                                        <button 
                                                            onClick={() => openEditModal(item)} 
                                                            className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 rounded transition flex items-center gap-1.5"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" /> Edit
                                                        </button>
                                                        
                                                        {/* Divider */}
                                                        <div className="w-px h-4 bg-slate-600 mx-0.5"></div>

                                                        {/* Print */}
                                                        <Link 
                                                            href={route('products.print', item.id)} 
                                                            className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 rounded transition flex items-center gap-1.5"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" /> Print
                                                        </Link>

                                                        {/* Divider */}
                                                        <div className="w-px h-4 bg-slate-600 mx-0.5"></div>

                                                        {/* Delete */}
                                                        <button 
                                                            onClick={() => handleDelete(item)} 
                                                            className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition flex items-center gap-1.5"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Del
                                                        </button>

                                                        {/* Tutup */}
                                                        <button 
                                                            onClick={() => setActiveRowId(null)} 
                                                            className="ml-1 p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition" 
                                                            title="Tutup Menu"
                                                        >
                                                            <ChevronsRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center text-slate-400">
                                            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            Tidak ada material ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                        <span className="text-xs text-slate-500">Total {materials.total}</span>
                        <div className="flex gap-1">
                            {materials.links.map((link, k) => (
                                link.url && (
                                    <Link 
                                        key={k} 
                                        href={link.url}
                                        className={`px-2 py-1 text-xs rounded border ${link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Package className={`w-5 h-5 ${isEditMode ? 'text-orange-600' : 'text-indigo-600'}`} /> 
                                {isEditMode ? 'Edit Material' : 'Material Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <InputLabel value="Nama Material / Produk *" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                        autoFocus 
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-center mb-2">
                                    <InputLabel value="SKU / Kode" className="text-blue-800" />
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                        Auto jika kosong
                                    </span>
                                </div>
                                <TextInput 
                                    className="w-full font-mono border-blue-200 focus:border-blue-500" 
                                    placeholder="(Kosongkan untuk Auto)" 
                                    value={data.sku} 
                                    onChange={e => setData('sku', e.target.value)} 
                                />
                                <InputError message={errors.sku} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <InputLabel value="Kategori" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        list="category-options" 
                                        value={data.category} 
                                        onChange={e => setData('category', e.target.value)} 
                                    />
                                    <datalist id="category-options">
                                        {categories.map((c, i) => <option key={i} value={c.name} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <InputLabel value="Satuan *" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        list="unit-options" 
                                        value={data.unit} 
                                        onChange={e => setData('unit', e.target.value)} 
                                    />
                                    <datalist id="unit-options">
                                        {units.map((u, i) => <option key={i} value={u} />)}
                                    </datalist>
                                    <InputError message={errors.unit} className="mt-1" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm">
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className={`px-6 py-2 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    <Save className="w-4 h-4" /> {isEditMode ? 'Simpan' : 'Buat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}