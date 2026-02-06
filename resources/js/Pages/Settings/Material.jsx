import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { 
    Search, Plus, Package, Filter, 
    Folder, FolderOpen, ChevronRight, Save, X, 
    Edit, Printer, Trash2, MoreHorizontal 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function MaterialIndex({ materials, categories, units, currentCategory, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categorySearch, setCategorySearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State untuk Mobile Menu (Dropdown)
    const [mobileMenuId, setMobileMenuId] = useState(null); 
    const mobileMenuRef = useRef(null);

    // State untuk Edit Mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // --- FORM DATA ---
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        sku: '',
        barcode: '',
        unit: '',
        category: currentCategory || '',
        min_stock_alert: 5
    });

    // Close mobile menu on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setMobileMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Kategori Sidebar
    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    // Handle Search
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.materials.create'), { 
                category: currentCategory,
                search: searchTerm 
            }, { preserveState: true, replace: true });
        }
    };

    // Handle Category Click
    const selectCategory = (catName) => {
        router.get(route('settings.materials.create'), { 
            category: catName === currentCategory ? null : catName,
            search: searchTerm
        }, { preserveState: true });
    };

    // Actions
    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        reset();
        if(currentCategory) setData('category', currentCategory);
        clearErrors();
        setIsModalOpen(true);
        setMobileMenuId(null);
    };

    const openEditModal = (item) => {
        setIsEditMode(true);
        setEditingId(item.id);
        setData({
            name: item.name,
            sku: item.sku,
            barcode: item.barcode || '',
            unit: item.unit,
            category: item.category || '',
            min_stock_alert: item.min_stock_alert
        });
        clearErrors();
        setIsModalOpen(true);
        setMobileMenuId(null);
    };

    const handleDelete = (item) => {
        if(confirm('Apakah Anda yakin ingin menghapus material ini?')) {
            destroy(route('products.destroy', item.id), {
                onSuccess: () => setMobileMenuId(null)
            });
        }
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
                
                {/* --- SIDEBAR KIRI (KATEGORI) --- */}
                <div className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden hidden md:flex">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-indigo-600" /> Kategori Material
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                            <input 
                                type="text"
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                placeholder="Filter kategori..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button 
                            onClick={() => selectCategory(null)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${!currentCategory ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <FolderOpen className="w-4 h-4" />
                            Semua Material
                        </button>
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => selectCategory(cat.name)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition group ${currentCategory === cat.name ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Folder className={`w-4 h-4 ${currentCategory === cat.name ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                                    <span className="truncate max-w-[140px] text-left">{cat.name}</span>
                                </div>
                                {currentCategory === cat.name && <ChevronRight className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- KONTEN KANAN (DATA GRID) --- */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    
                    {/* Toolbar */}
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
                        <button 
                            onClick={openCreateModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Material Baru</span>
                        </button>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto pb-20 md:pb-0"> {/* Padding bottom for mobile scroll */}
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
                                <tr>
                                    <th className="px-4 py-3 border-r border-slate-200 w-12 text-center">No</th>
                                    <th className="px-4 py-3 border-r border-slate-200">SKU / ID</th>
                                    <th className="px-4 py-3 border-r border-slate-200">Nama Material</th>
                                    <th className="px-4 py-3 border-r border-slate-200 hidden md:table-cell">Kategori</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-center">Satuan</th>
                                    <th className="px-4 py-3 border-r border-slate-200 hidden md:table-cell">Barcode</th>
                                    {/* <th className="px-4 py-3 text-center w-40">Aksi</th> */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {materials.data.length > 0 ? (
                                    materials.data.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-indigo-50/50 transition group relative">
                                            <td className="px-4 py-3 text-center border-r border-slate-100 text-slate-400 font-mono text-xs">
                                                {materials.from + index}
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 font-mono font-bold text-indigo-700 text-xs">
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
                                            <td className="px-4 py-3 border-r border-slate-100 hidden md:table-cell font-mono text-xs text-slate-500">
                                                {item.barcode || item.sku}
                                            </td>
                                            
                                            {/* --- KOLOM AKSI (HOVER EFFECT) --- */}
                                            <td className="px-4 py-2 text-center relative">
                                                
                                                {/* DESKTOP: Hover Show Buttons */}
                                                <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-slate-200 gap-1 z-10">
                                                    <button 
                                                        onClick={() => openEditModal(item)}
                                                        className="px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded hover:bg-slate-700 flex items-center gap-1"
                                                    >
                                                        Edit
                                                    </button>
                                                    <Link 
                                                        href={route('products.print', item.id)}
                                                        className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-500 flex items-center gap-1"
                                                    >
                                                        Print
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleDelete(item)}
                                                        className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-500 flex items-center gap-1"
                                                    >
                                                        Del
                                                    </button>
                                                </div>

                                                {/* MOBILE: Kebab Menu */}
                                                <div className="md:hidden relative">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMobileMenuId(mobileMenuId === item.id ? null : item.id);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                                                    >
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>

                                                    {/* Dropdown Menu Mobile */}
                                                    {mobileMenuId === item.id && (
                                                        <div ref={mobileMenuRef} className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
                                                            <button 
                                                                onClick={() => openEditModal(item)}
                                                                className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                                                            >
                                                                <Edit className="w-3 h-3" /> Edit Data
                                                            </button>
                                                            <Link 
                                                                href={route('products.print', item.id)}
                                                                className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                                                            >
                                                                <Printer className="w-3 h-3" /> Print Label
                                                            </Link>
                                                            <div className="border-t border-slate-100 my-1"></div>
                                                            <button 
                                                                onClick={() => handleDelete(item)}
                                                                className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-3 h-3" /> Hapus
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
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

                    {/* Footer Pagination */}
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
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
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
                                        placeholder="Contoh: Baut 10mm Stainless"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        autoFocus
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-center mb-2">
                                    <InputLabel value="SKU / Kode Material" className="text-blue-800" />
                                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Auto-Generate jika kosong</span>
                                </div>
                                <div className="flex gap-2">
                                    <TextInput 
                                        className="w-full font-mono placeholder:text-blue-300 border-blue-200 focus:border-blue-500 focus:ring-blue-500" 
                                        placeholder="(Kosongkan untuk Auto Barcode)"
                                        value={data.sku}
                                        onChange={e => setData('sku', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.sku} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <InputLabel value="Kategori" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        list="category-options"
                                        placeholder="Pilih Kategori..."
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                    />
                                    <datalist id="category-options">
                                        {categories.map((c, i) => <option key={i} value={c.name} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <InputLabel value="Satuan (UOM) *" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        list="unit-options"
                                        placeholder="Pcs, Box, Set..."
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
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm">Batal</button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className={`px-6 py-2 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    <Save className="w-4 h-4" /> {isEditMode ? 'Simpan Perubahan' : 'Simpan & Buat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}