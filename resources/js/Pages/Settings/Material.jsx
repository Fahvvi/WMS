import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Search, Plus, Package, Filter, 
    Folder, FolderOpen, ChevronRight, ChevronDown, Save, X, 
    Edit, Printer, Trash2, MoreHorizontal, 
    Upload, Download, AlertCircle, Camera 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import Swal from 'sweetalert2';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useLaravelReactI18n } from 'laravel-react-i18n'; 
import BarcodeScanner from '@/Components/BarcodeScanner'; // <--- IMPORT SCANNER

export default function MaterialIndex({ materials, categories, units, currentCategory, filters }) {
    const { t } = useLaravelReactI18n(); 
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [categorySearch, setCategorySearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State Scanner Khusus Modal
    const [showScanner, setShowScanner] = useState(false);

    // State untuk Buka Tutup Folder Kategori
    const [openCategories, setOpenCategories] = useState({});
    
    // State untuk Aksi Tabel
    const [activeRowId, setActiveRowId] = useState(null); 
    const actionRef = useRef(null);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '', sku: '', barcode: '', unit: '', category: currentCategory || '', min_stock_alert: 5
    });

    useEffect(() => {
        function handleClickOutside(event) {
            if (actionRef.current && !actionRef.current.contains(event.target)) {
                setActiveRowId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('auto_edit') === 'true' && materials.data.length === 1) {
            openEditModal(materials.data[0]);
            const newUrl = window.location.pathname + window.location.search.replace(/&?auto_edit=true/, '');
            window.history.replaceState({}, '', newUrl);
        }
    }, [materials.data]);

    // --- ALGORITMA SISTEM POHON KATEGORI ---
    const structuredCategories = useMemo(() => {
        const tree = {}; 
        const singles = []; 

        // 1. Pisahkan Induk (Root) dan Anak (Child) dari database
        const roots = categories.filter(c => !c.parent_id);
        const children = categories.filter(c => c.parent_id);

        // 2. Susun Anak ke dalam Induknya masing-masing
        roots.forEach(root => {
            const myChildren = children.filter(c => c.parent_id === root.id);

            if (myChildren.length > 0) {
                tree[root.name] = { 
                    isParent: true, 
                    originalName: root.name,
                    children: myChildren.map(child => ({
                        originalName: child.name, 
                        displayName: child.name     
                    }))
                };
            } else {
                singles.push(root); // Induk yang tidak punya anak
            }
        });

        // 3. Tangani Anak yang kehilangan Induk (Orphan)
        children.forEach(child => {
            if (!roots.find(r => r.id === child.parent_id)) {
                singles.push(child);
            }
        });

        // 4. Fitur Filter Pencarian (Search Bar Kategori Kiri)
        if (categorySearch) {
            const keyword = categorySearch.toLowerCase();
            const filteredTree = {};
            const filteredSingles = singles.filter(c => c.name.toLowerCase().includes(keyword));

            Object.entries(tree).forEach(([parentName, group]) => {
                const matchParent = parentName.toLowerCase().includes(keyword);
                const matchedChildren = group.children.filter(c => c.displayName.toLowerCase().includes(keyword));

                // Jika nama induk cocok ATAU ada nama anaknya yang cocok, tampilkan folder tersebut
                if (matchParent || matchedChildren.length > 0) {
                    filteredTree[parentName] = {
                        ...group,
                        children: matchParent ? group.children : matchedChildren
                    };
                }
            });
            return { tree: filteredTree, singles: filteredSingles };
        }

        return { tree, singles };
    }, [categories, categorySearch]);

    const toggleCategoryGroup = (parentName) => {
        setOpenCategories(prev => ({ ...prev, [parentName]: !prev[parentName] }));
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.materials.create'), { category: currentCategory, search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    const selectCategory = (catName) => {
        router.get(route('settings.materials.create'), { category: catName === currentCategory ? null : catName, search: searchTerm }, { preserveState: true });
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        reset(); 
        if(currentCategory) setData('category', currentCategory);
        clearErrors();
        setIsModalOpen(true);
        setActiveRowId(null);
    };

    const openEditModal = (item) => {
        setIsEditMode(true);
        setEditingId(item.id);
        setData({
            name: item.name,
            sku: item.sku || '',
            barcode: item.barcode || '',
            unit: item.unit,
            category: item.category || '',
            min_stock_alert: item.min_stock_alert
        });
        clearErrors();
        setIsModalOpen(true);
        setActiveRowId(null); 
    };

    const handleDelete = (item) => {
        Swal.fire({
            title: t('Hapus Material?'),
            html: t(`Anda akan menghapus material <b>"${item.name}"</b>.<br/><span style="font-size:12px; color:red">Stok terkait di gudang mungkin akan error!</span>`),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: t('Ya, Hapus!'),
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('products.destroy', item.id), {
                    onSuccess: () => setActiveRowId(null)
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

    const isParentActive = (parentName) => {
        if (!currentCategory) return false;
        if (currentCategory === parentName) return true;
        
        // Jika kita sedang mengklik kategori "Battery", cek apakah "Battery" ada di dalam grup "Elektronik"
        const group = structuredCategories.tree[parentName];
        if (group && group.children.some(c => c.originalName === currentCategory)) {
            return true;
        }
        return false;
    };

    // Handler jika scan berhasil dari modal
    const handleCameraScan = (decodedText) => {
        setShowScanner(false);
        setData('sku', decodedText);
    };

    return (
        <SettingsLayout title={t('Material Master Data')}>
            
            {/* OVERLAY SCANNER */}
            {showScanner && <BarcodeScanner onScanSuccess={handleCameraScan} onClose={() => setShowScanner(false)} />}

            <div className="flex h-[calc(100vh-10rem)] gap-4">
                
                {/* --- SIDEBAR KIRI (SISTEM POHON KATEGORI) --- */}
                <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden hidden md:flex transition-colors">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> {t('Kategori')}
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                                placeholder={t('Filter...')}
                                value={categorySearch} 
                                onChange={(e) => setCategorySearch(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        <button 
                            onClick={() => selectCategory(null)} 
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!currentCategory ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            <FolderOpen className="w-4 h-4" /> {t('Semua Material')}
                        </button>
                        
                        {Object.entries(structuredCategories.tree).map(([parentName, group]) => {
                            const isOpen = openCategories[parentName];
                            const parentActive = isParentActive(parentName);

                            return (
                                <div key={parentName} className="pt-1">
                                    <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${parentActive ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                                        <div className="flex items-center gap-1 flex-1 overflow-hidden">
                                            <button 
                                                onClick={() => toggleCategoryGroup(parentName)} 
                                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors focus:outline-none"
                                            >
                                                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                className={`flex-1 flex items-center gap-2 text-left truncate transition-colors ${parentActive ? 'text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium'}`}
                                                onClick={() => selectCategory(parentName)}
                                            >
                                                <Folder className={`w-4 h-4 shrink-0 ${parentActive ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`} />
                                                <span className="truncate">{parentName}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="ml-5 mt-1 border-l-2 border-slate-100 dark:border-slate-700 pl-3 space-y-1">
                                            {group.children.map((child, idx) => {
                                                const isChildActive = currentCategory === child.originalName;
                                                return (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => selectCategory(child.originalName)}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${isChildActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium'}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChildActive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                        <span className="truncate text-left">{child.displayName}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {structuredCategories.singles.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-700 my-3 mx-2"></div>}
                        {structuredCategories.singles.map((cat, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => selectCategory(cat.name)} 
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition group ${currentCategory === cat.name ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Folder className={`w-4 h-4 ${currentCategory === cat.name ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500'}`} />
                                    <span className="truncate max-w-[140px] text-left">{cat.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- KONTEN KANAN (TABEL & TOOLBAR) --- */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-colors">
                    
                    {/* Header Toolbar Kanan */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="relative w-full xl:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-full h-10 pl-9 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400" 
                                placeholder={t('Cari material...')} 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                onKeyDown={handleSearch} 
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
                            <button className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition font-medium text-sm shadow-sm">
                                <Upload className="w-4 h-4 text-slate-400" /> <span className="hidden sm:inline">{t('Import')}</span>
                            </button>
                            <a href={route('products.export')} className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition font-medium text-sm shadow-sm">
                                <Download className="w-4 h-4 text-slate-400" /> <span className="hidden sm:inline">{t('Export')}</span>
                            </a>
                            <button onClick={openCreateModal} className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition ml-auto sm:ml-0">
                                <Plus className="w-4 h-4" /> <span>{t('Material Baru')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Wrapper Tabel */}
                    <div className="flex-1 overflow-auto pb-20 md:pb-0 relative">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                                <tr>
                                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 w-12 text-center">No</th>
                                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">SKU / ID</th>
                                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700">{t('Nama Material')}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 hidden md:table-cell">{t('Kategori')}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center">{t('Satuan')}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 hidden md:table-cell">{t('Barcode')}</th>
                                    <th className="px-2 py-3 text-center w-14">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {materials.data.length > 0 ? (
                                    materials.data.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group relative">
                                            <td className="px-4 py-3 text-center border-r border-slate-100 dark:border-slate-700 text-slate-400 font-mono text-xs">
                                                {materials.from + index}
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700 font-mono font-bold text-indigo-700 dark:text-indigo-400 text-xs select-all">
                                                {item.sku}
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200">
                                                {item.name}
                                                <div className="md:hidden text-xs text-slate-400 mt-0.5">{item.category}</div>
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700 hidden md:table-cell">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                                                    {item.category || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700 text-center text-xs">
                                                {item.unit}
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700 hidden md:table-cell font-mono text-xs text-slate-500 select-all">
                                                {item.barcode || item.sku}
                                            </td>
                                            <td className="px-2 py-3 text-center relative align-middle w-14">
                                                <div className="text-slate-300 dark:text-slate-600 transition-opacity duration-200 opacity-100 group-hover:opacity-0 md:hidden block">
                                                    <MoreHorizontal className="w-5 h-5 mx-auto" onClick={() => setActiveRowId(item.id)} />
                                                </div>
                                                <div className="text-slate-300 dark:text-slate-600 transition-opacity duration-200 opacity-100 group-hover:opacity-0 hidden md:block">
                                                    <MoreHorizontal className="w-5 h-5 mx-auto" />
                                                </div>

                                                <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 p-1.5 transition-all duration-300 
                                                    ${activeRowId === item.id ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-x-0 md:group-hover:pointer-events-auto'}`
                                                }>
                                                    <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition" title={t('Edit')}>
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <Link href={route('products.print', item.id)} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition" title={t('Print')}>
                                                        <Printer className="w-4 h-4" />
                                                    </Link>
                                                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5"></div>
                                                    <button onClick={() => handleDelete(item)} className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title={t('Delete')}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                    {activeRowId === item.id && (
                                                        <button onClick={() => setActiveRowId(null)} className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center text-slate-400 dark:text-slate-500">
                                            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            {t('Tidak ada material ditemukan.')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center transition-colors">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Total {materials.total}</span>
                        <div className="flex gap-1">
                            {materials.links.map((link, k) => (
                                link.url && (
                                    <Link 
                                        key={k} 
                                        href={link.url}
                                        className={`px-2 py-1 text-xs rounded border transition-colors ${link.active ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Package className={`w-5 h-5 ${isEditMode ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-600 dark:text-indigo-400'}`} /> 
                                {isEditMode ? t('Edit Material') : t('Material Baru')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <InputLabel value={t('Kategori')} className="dark:text-slate-300" />
                                    <select 
                                        className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl shadow-sm text-sm h-10 transition-colors"
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                    >
                                        <option value="">-- {t('Pilih Kategori')} --</option>
                                        
                                        {/* Render Kategori Ber-induk (Hierarchy) */}
                                        {Object.entries(structuredCategories.tree).map(([parentName, group]) => (
                                            <optgroup key={parentName} label={parentName}>
                                                <option value={parentName}>{parentName} (Induk)</option>
                                                {group.children.map((child, idx) => (
                                                    <option key={`${parentName}-${idx}`} value={child.originalName}>
                                                        — {child.displayName}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}

                                        {/* Render Kategori Tunggal (Single) */}
                                        {structuredCategories.singles.length > 0 && (
                                            <optgroup label="Lainnya">
                                                {structuredCategories.singles.map((cat, idx) => (
                                                    <option key={`single-${idx}`} value={cat.name}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                        
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                <div className="flex justify-between items-center mb-2">
                                    <InputLabel value={t('SKU / Kode')} className="text-blue-800 dark:text-blue-300 font-bold" />
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                                        {t('Auto jika kosong')}
                                    </span>
                                </div>
                                {/* FLEX CONTAINER UNTUK INPUT SKU DAN TOMBOL KAMERA */}
                                <div className="flex gap-2">
                                    <TextInput 
                                        className="w-full font-mono bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-700/50 text-slate-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400" 
                                        placeholder={t('(Kosongkan untuk Auto)')} 
                                        value={data.sku} 
                                        onChange={e => setData('sku', e.target.value)} 
                                    />
                                    {/* Tombol Kamera (Muncul hanya di Mobile: md:hidden) */}
                                    <button 
                                        type="button"
                                        onClick={() => setShowScanner(true)}
                                        className="flex-shrink-0 w-11 flex md:hidden items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                                        title={t('Scan Barcode')}
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                </div>
                                <InputError message={errors.sku} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <InputLabel value={t('Kategori')} className="dark:text-slate-300" />
                                    <select 
                                        className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl shadow-sm text-sm h-10 transition-colors"
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                    >
                                        <option value="">-- {t('Pilih Kategori')} --</option>
                                        {categories.map((c, i) => (
                                            <option key={i} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <InputLabel value={t('Satuan *')} className="dark:text-slate-300" />
                                    </div>
                                    <select 
                                        className="w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl shadow-sm text-sm h-10 transition-colors"
                                        value={data.unit}
                                        onChange={e => setData('unit', e.target.value)}
                                    >
                                        <option value="">-- {t('Pilih Satuan')} --</option>
                                        {units.map((u, i) => (
                                            <option key={i} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-1">
                                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                        <span>
                                            {t('Satuan tidak ada? Tambahkan di menu ')}
                                            <Link href={route('settings.warehouses.index')} className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                                                {t('Settings > Master Gudang & Unit')}
                                            </Link>
                                        </span>
                                    </div>
                                    <InputError message={errors.unit} className="mt-1" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">
                                    {t('Batal')}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className={`px-6 py-2.5 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-colors ${isEditMode ? 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'}`}
                                >
                                    <Save className="w-4 h-4" /> {isEditMode ? t('Simpan') : t('Buat')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}