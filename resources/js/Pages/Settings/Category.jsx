import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, Plus, Tag, Edit, Trash2, Save, X, Palette, Hash 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function CategoryIndex({ categories, allCategories, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Form Hook
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        color: '#6366f1', // Default Indigo
        parent_id: ''
    });

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
    };

    const handleDelete = (cat) => {
        if(confirm(`Hapus kategori "${cat.name}"?`)) {
            destroy(route('settings.categories.destroy', cat.id));
        }
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
        <SettingsLayout title="Manajemen Kategori">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* Header Toolbar */}
                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex-1 w-full sm:w-auto relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="Cari nama atau kode..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            onKeyDown={handleSearch} 
                        />
                    </div>
                    <button 
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Kategori Baru
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Nama Kategori</th>
                                <th className="px-6 py-3">Kode (Prefix)</th>
                                <th className="px-6 py-3">Warna Label</th>
                                <th className="px-6 py-3">Induk (Parent)</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {categories.data.length > 0 ? (
                                categories.data.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-3 font-medium text-slate-800">{cat.name}</td>
                                        <td className="px-6 py-3 font-mono font-bold">{cat.code}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: cat.color }}></span>
                                                <span className="text-xs text-slate-500 uppercase">{cat.color}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            {cat.parent ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                    {cat.parent.name}
                                                </span>
                                            ) : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(cat)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(cat)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Belum ada data kategori.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-indigo-600" /> {isEditMode ? 'Edit Kategori' : 'Kategori Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            {/* Nama & Kode */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <InputLabel value="Nama Kategori *" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        placeholder="Contoh: Battery Lithium"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        autoFocus
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Kode (Prefix) *" />
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <TextInput 
                                            className="w-full pl-9 mt-1 font-mono uppercase" 
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
                                    <InputLabel value="Warna Label" />
                                    <div className="flex gap-2 mt-1">
                                        <div className="relative overflow-hidden w-10 h-10 rounded-lg border border-slate-300 shadow-sm">
                                            <input 
                                                type="color" 
                                                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                                value={data.color}
                                                onChange={(e) => setData('color', e.target.value)}
                                            />
                                        </div>
                                        <TextInput 
                                            className="flex-1 uppercase"
                                            value={data.color}
                                            onChange={(e) => setData('color', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Selector */}
                            <div>
                                <InputLabel value="Induk Kategori (Opsional)" />
                                <select 
                                    className="w-full mt-1 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                    value={data.parent_id}
                                    onChange={(e) => setData('parent_id', e.target.value)}
                                >
                                    <option value="">- Tidak Ada (Root) -</option>
                                    {allCategories
                                        .filter(c => c.id !== editingCategory?.id) // Jangan tampilkan diri sendiri
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Pilih jika ini adalah sub-kategori.</p>
                            </div>

                            {/* Live Preview */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Preview Tampilan:</span>
                                <span 
                                    className="px-3 py-1 rounded text-xs font-bold text-white shadow-sm flex items-center gap-2"
                                    style={{ backgroundColor: data.color }}
                                >
                                    {data.code || 'CODE'} - {data.name || 'Nama Kategori'}
                                </span>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm">Batal</button>
                                <button type="submit" disabled={processing} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}