import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, Plus, Tag, Edit, Trash2, Save, X, Hash, Layers, Ruler 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function AttributeIndex({ units, categories, allCategories, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    
    // --- STATE MODALS ---
    const [unitModal, setUnitModal] = useState({ open: false, editMode: false, id: null });
    const [catModal, setCatModal] = useState({ open: false, editMode: false, id: null });

    // --- FORM HOOKS ---
    const unitForm = useForm({ name: '', short_name: '' });
    const catForm = useForm({ name: '', code: '', color: '#6366f1', parent_id: '' });

    // Search Handler
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.attributes.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    // ================= UNIT LOGIC =================
    const openUnitModal = (item = null) => {
        unitForm.reset();
        unitForm.clearErrors();
        if (item) {
            setUnitModal({ open: true, editMode: true, id: item.id });
            unitForm.setData({ name: item.name, short_name: item.short_name });
        } else {
            setUnitModal({ open: true, editMode: false, id: null });
        }
    };

    const submitUnit = (e) => {
        e.preventDefault();
        const routeName = unitModal.editMode ? 'settings.units.update' : 'settings.units.store';
        const action = unitModal.editMode ? unitForm.put : unitForm.post;
        action(route(routeName, unitModal.id), { onSuccess: () => setUnitModal({ ...unitModal, open: false }) });
    };

    const deleteUnit = (id) => {
        if(confirm('Hapus satuan ini?')) router.delete(route('settings.units.destroy', id));
    };

    // ================= CATEGORY LOGIC =================
    const openCatModal = (item = null) => {
        catForm.reset();
        catForm.clearErrors();
        if (item) {
            setCatModal({ open: true, editMode: true, id: item.id });
            catForm.setData({
                name: item.name, 
                code: item.code,
                color: item.color || '#6366f1', 
                parent_id: item.parent_id || ''
            });
        } else {
            setCatModal({ open: true, editMode: false, id: null });
        }
    };

    const submitCat = (e) => {
        e.preventDefault();
        const routeName = catModal.editMode ? 'settings.categories.update' : 'settings.categories.store';
        const action = catModal.editMode ? catForm.put : catForm.post;
        action(route(routeName, catModal.id), { onSuccess: () => setCatModal({ ...catModal, open: false }) });
    };

    const deleteCat = (id) => {
        if(confirm('Hapus kategori ini?')) router.delete(route('settings.categories.destroy', id));
    };

    return (
        <SettingsLayout title="Atribut Produk">
            <div className="space-y-8 max-w-5xl mx-auto pb-10">
                
                {/* SEARCH BAR GLOBAL */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="Cari Satuan atau Kategori..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            onKeyDown={handleSearch} 
                        />
                    </div>
                </div>

                {/* ================= BAGIAN 1: UNIT (SATUAN) ================= */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-indigo-600" /> Master Satuan (Unit)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Daftar satuan pengukuran (UOM) untuk produk.</p>
                        </div>
                        <button onClick={() => openUnitModal()} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition">
                            <Plus className="w-4 h-4" /> Tambah Satuan
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 w-16 text-center">No</th>
                                    <th className="px-6 py-3">Nama Satuan</th>
                                    <th className="px-6 py-3">Singkatan</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* UNITS ADALAH ARRAY (->get()), JADI BISA LANGSUNG .map */}
                                {units.length > 0 ? (
                                    units.map((u, i) => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-3 text-center text-slate-400">{i + 1}</td>
                                            <td className="px-6 py-3 font-medium text-slate-800">{u.name}</td>
                                            <td className="px-6 py-3 font-mono text-xs bg-slate-100 rounded w-fit px-2">{u.short_name}</td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openUnitModal(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteUnit(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Belum ada data satuan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ================= BAGIAN 2: KATEGORI & KODE ================= */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-orange-600" /> Kategori & Kode
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Pengelompokan barang dan prefix kode SKU otomatis.</p>
                        </div>
                        <button onClick={() => openCatModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md flex items-center gap-2 transition">
                            <Plus className="w-4 h-4" /> Kategori Baru
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Nama Kategori</th>
                                    <th className="px-6 py-3">Kode (Prefix)</th>
                                    <th className="px-6 py-3">Label Warna</th>
                                    <th className="px-6 py-3">Induk (Parent)</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* PERBAIKAN DI SINI: GUNAKAN categories.data.map KARENA PAGINATION */}
                                {categories.data && categories.data.length > 0 ? (
                                    categories.data.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-3 font-medium text-slate-800">{cat.name}</td>
                                            <td className="px-6 py-3 font-mono font-bold text-indigo-700">{cat.code}</td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: cat.color }}></span>
                                                    <span className="text-[10px] text-slate-400 uppercase">{cat.color}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                {cat.parent ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                                        <Layers className="w-3 h-3" /> {cat.parent.name}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openCatModal(cat)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteCat(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">Belum ada data kategori.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Category (Jika ada lebih dari 10 data) */}
                    {categories.links && (
                        <div className="p-4 border-t border-slate-100 flex justify-center gap-1">
                            {/* Pagination Logic Sederhana */}
                        </div>
                    )}
                </div>

                {/* ================= MODAL UNIT ================= */}
                {unitModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="font-bold text-lg mb-4">{unitModal.editMode ? 'Edit Satuan' : 'Tambah Satuan'}</h3>
                            <form onSubmit={submitUnit} className="space-y-4">
                                <div>
                                    <InputLabel value="Nama Satuan (misal: Pieces)" />
                                    <TextInput className="w-full mt-1" value={unitForm.data.name} onChange={e => unitForm.setData('name', e.target.value)} autoFocus />
                                    <InputError message={unitForm.errors.name} />
                                </div>
                                <div>
                                    <InputLabel value="Singkatan (misal: Pcs)" />
                                    <TextInput className="w-full mt-1" value={unitForm.data.short_name} onChange={e => unitForm.setData('short_name', e.target.value)} />
                                    <InputError message={unitForm.errors.short_name} />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" onClick={() => setUnitModal({ ...unitModal, open: false })} className="px-4 py-2 text-slate-600 font-bold text-sm">Batal</button>
                                    <button type="submit" disabled={unitForm.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ================= MODAL CATEGORY ================= */}
                {catModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-indigo-600" /> {catModal.editMode ? 'Edit Kategori' : 'Kategori Baru'}
                                </h3>
                                <button onClick={() => setCatModal({ ...catModal, open: false })}><X className="w-5 h-5 text-slate-400" /></button>
                            </div>
                            <form onSubmit={submitCat} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <InputLabel value="Nama Kategori *" />
                                        <TextInput className="w-full mt-1" placeholder="Contoh: Battery Lithium" value={catForm.data.name} onChange={e => catForm.setData('name', e.target.value)} autoFocus />
                                        <InputError message={catForm.errors.name} />
                                    </div>
                                    <div>
                                        <InputLabel value="Kode Prefix *" />
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <TextInput className="w-full pl-9 mt-1 font-mono uppercase" placeholder="BT" maxLength={5} value={catForm.data.code} onChange={e => catForm.setData('code', e.target.value.toUpperCase())} />
                                        </div>
                                        <InputError message={catForm.errors.code} />
                                    </div>
                                    <div>
                                        <InputLabel value="Warna Label" />
                                        <div className="flex gap-2 mt-1">
                                            <div className="relative overflow-hidden w-10 h-10 rounded-lg border border-slate-300 shadow-sm">
                                                <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" value={catForm.data.color} onChange={e => catForm.setData('color', e.target.value)} />
                                            </div>
                                            <TextInput className="flex-1 uppercase" value={catForm.data.color} onChange={e => catForm.setData('color', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <InputLabel value="Induk Kategori (Opsional)" />
                                    {/* GUNAKAN allCategories UNTUK DROPDOWN, JANGAN categories.data */}
                                    <select className="w-full mt-1 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm" value={catForm.data.parent_id} onChange={(e) => catForm.setData('parent_id', e.target.value)}>
                                        <option value="">- Tidak Ada (Root) -</option>
                                        {allCategories.filter(c => c.id !== catModal.id).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500">Preview:</span>
                                    <span className="px-3 py-1 rounded text-xs font-bold text-white shadow-sm flex items-center gap-2" style={{ backgroundColor: catForm.data.color }}>
                                        {catForm.data.code || 'CODE'} - {catForm.data.name || 'Nama Kategori'}
                                    </span>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setCatModal({ ...catModal, open: false })} className="px-5 py-2 text-slate-600 font-bold text-sm">Batal</button>
                                    <button type="submit" disabled={catForm.processing} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </SettingsLayout>
    );
}