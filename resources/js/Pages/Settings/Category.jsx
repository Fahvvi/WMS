import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Tag, Edit, Trash2, Save, X, Hash, 
    MoreHorizontal, ChevronsLeft, ChevronsRight, CornerDownRight 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';
import { useLaravelReactI18n } from 'laravel-react-i18n';

export default function CategoryIndex({ categories, allCategories, filters }) {
    const { t } = useLaravelReactI18n(); 
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // State untuk Aksi Tabel (Floating Toolbar)
    const [activeRowId, setActiveRowId] = useState(null);
    const actionRef = useRef(null);

    // Form Hook
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        color: '#6366f1', // Default Indigo
        parent_id: ''
    });

    // Menutup menu aksi jika klik di luar
    useEffect(() => {
        function handleClickOutside(event) {
            if (actionRef.current && !actionRef.current.contains(event.target)) {
                setActiveRowId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- ALGORITMA PENGURUTAN INDUK & ANAK ---
    // Mengubah array flat menjadi urutan: Induk 1, Anak 1.1, Anak 1.2, Induk 2, dst.
    const sortedCategories = useMemo(() => {
        const rawData = categories.data || [];
        const roots = rawData.filter(c => !c.parent_id); // Induk sejati
        const children = rawData.filter(c => c.parent_id); // Yang punya parent

        const result = [];
        
        // Loop setiap induk, lalu masukkan anak-anaknya tepat di bawahnya
        roots.forEach(root => {
            result.push({ ...root, level: 0 });
            
            const myChildren = children.filter(c => c.parent_id === root.id);
            myChildren.forEach(child => {
                result.push({ ...child, level: 1 });
            });
        });

        // Jaga-jaga jika ada anak yang induknya ada di halaman pagination lain (Orphaned)
        const orphaned = children.filter(c => !roots.find(r => r.id === c.parent_id));
        orphaned.forEach(orphan => {
            result.push({ ...orphan, level: 1, isOrphan: true });
        });

        return result;
    }, [categories.data]);

    // Search Handler
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.categories.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    // Actions
    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingCategory(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
        setActiveRowId(null);
    };

    const openEditModal = (cat) => {
        setIsEditMode(true);
        setEditingCategory(cat);
        setData({
            name: cat.name,
            code: cat.code,
            color: cat.color || '#6366f1',
            parent_id: cat.parent_id || ''
        });
        clearErrors();
        setIsModalOpen(true);
        setActiveRowId(null);
    };

    const handleDelete = (cat) => {
        Swal.fire({
            title: t('Hapus Kategori?'),
            html: t(`Anda akan menghapus kategori <b>"${cat.name}"</b>.`),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: t('Ya, Hapus!'),
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('settings.categories.destroy', cat.id), {
                    onSuccess: () => setActiveRowId(null)
                });
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('settings.categories.update', editingCategory.id), { onSuccess: () => setIsModalOpen(false) });
        } else {
            post(route('settings.categories.store'), { onSuccess: () => setIsModalOpen(false) });
        }
    };

    return (
        <SettingsLayout title={t('Manajemen Kategori')}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors flex flex-col h-[calc(100vh-10rem)]">
                
                {/* Header Toolbar (Tinggi 10, Rounded-xl) */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex-1 w-full sm:w-auto relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full h-10 pl-9 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400" 
                            placeholder={t('Cari nama atau kode...')} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            onKeyDown={handleSearch} 
                        />
                    </div>
                    <button 
                        onClick={openCreateModal}
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition w-full sm:w-auto ml-auto"
                    >
                        <Plus className="w-4 h-4" /> {t('Kategori Baru')}
                    </button>
                </div>

                {/* Table Wrapper (Bisa di-scroll) */}
                <div className="flex-1 overflow-auto relative">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                            <tr>
                                <th className="px-6 py-4">{t('Nama Kategori')}</th>
                                <th className="px-6 py-4">{t('Kode (Prefix)')}</th>
                                <th className="px-6 py-4">{t('Warna Label')}</th>
                                {/* Kolom Aksi yang Diperkecil */}
                                <th className="px-2 py-4 text-center w-16">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {sortedCategories.length > 0 ? (
                                sortedCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group relative">
                                        
                                        {/* Nama Kategori dengan Indentasi Pohon */}
                                        <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">
                                            <div className="flex items-center gap-2">
                                                {/* Jika Level 1 (Anak), tambahkan ikon L terbalik dan margin kiri */}
                                                {cat.level > 0 && (
                                                    <CornerDownRight className="w-4 h-4 text-slate-300 dark:text-slate-500 ml-5 shrink-0" />
                                                )}
                                                
                                                <span className={cat.level === 0 ? "font-bold text-slate-900 dark:text-white" : ""}>
                                                    {cat.name}
                                                </span>
                                                
                                                {/* Jika Orphanned (Induknya tidak ter-load karena pagination) */}
                                                {cat.isOrphan && (
                                                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-2">
                                                        {t('Induk')}: {cat.parent?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{cat.code}</td>
                                        
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm" style={{ backgroundColor: cat.color }}></span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-mono">{cat.color}</span>
                                            </div>
                                        </td>

                                        {/* --- KOLOM AKSI (Hover Smooth Menu) --- */}
                                        <td className="px-2 py-3 text-center relative align-middle w-16">
                                            {activeRowId !== cat.id ? (
                                                <button 
                                                    onClick={() => setActiveRowId(cat.id)}
                                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition"
                                                    title={t('Aksi')}
                                                >
                                                    <ChevronsLeft className="w-5 h-5 mx-auto" />
                                                </button>
                                            ) : (
                                                <div 
                                                    ref={actionRef}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 p-1.5 animate-in slide-in-from-right-4 duration-200"
                                                >
                                                    <button onClick={() => openEditModal(cat)} className="p-1.5 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition" title={t('Edit')}>
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5"></div>
                                                    <button onClick={() => handleDelete(cat)} className="p-1.5 text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title={t('Delete')}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    
                                                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1"></div>
                                                    
                                                    <button onClick={() => setActiveRowId(null)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition" title={t('Tutup')}>
                                                        <ChevronsRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400 dark:text-slate-500">
                                        <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        {t('Belum ada data kategori.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder (Jika Anda ingin menambahkannya nanti di controller) */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center transition-colors">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total {categories.data ? categories.data.length : categories.length} {t('Kategori')}</span>
                </div>
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
                                {isEditMode ? t('Edit Kategori') : t('Kategori Baru')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            {/* Nama & Kode */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <InputLabel value={t('Nama Kategori *')} className="dark:text-slate-300" />
                                    <TextInput 
                                        className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" 
                                        placeholder={t('Contoh: Battery Lithium')}
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        autoFocus
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value={t('Kode (Prefix) *')} className="dark:text-slate-300" />
                                    <div className="relative mt-1">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <TextInput 
                                            className="w-full pl-9 font-mono uppercase bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" 
                                            placeholder="BT"
                                            maxLength={5}
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    <InputError message={errors.code} className="mt-1" />
                                </div>
                                
                                {/* Color Picker Visual */}
                                <div>
                                    <InputLabel value={t('Warna Label')} className="dark:text-slate-300" />
                                    <div className="flex gap-2 mt-1">
                                        <div className="relative overflow-hidden w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm shrink-0">
                                            <input 
                                                type="color" 
                                                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                                value={data.color}
                                                onChange={(e) => setData('color', e.target.value)}
                                            />
                                        </div>
                                        <TextInput 
                                            className="flex-1 uppercase font-mono bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl"
                                            value={data.color}
                                            onChange={(e) => setData('color', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Selector */}
                            <div>
                                <InputLabel value={t('Induk Kategori (Opsional)')} className="dark:text-slate-300" />
                                <select 
                                    className="w-full mt-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl shadow-sm text-sm transition-colors h-10"
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                >
                                    <option value="">- {t('Tidak Ada (Root)')} -</option>
                                    {allCategories
                                        .filter(c => c.id !== editingCategory?.id) 
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('Pilih jika ini adalah sub-kategori.')}</p>
                            </div>

                            {/* Live Preview */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Preview Tampilan')}:</span>
                                <span 
                                    className="px-3 py-1 rounded text-xs font-bold text-white shadow-sm flex items-center gap-2"
                                    style={{ backgroundColor: data.color }}
                                >
                                    {data.code || 'CODE'} - {data.name || t('Nama Kategori')}
                                </span>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">
                                    {t('Batal')}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-colors"
                                >
                                    <Save className="w-4 h-4" /> {isEditMode ? t('Simpan') : t('Simpan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}