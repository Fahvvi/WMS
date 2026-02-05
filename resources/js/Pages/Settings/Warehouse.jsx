import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Warehouse, Plus, MapPin, Edit2, Trash2, Search, X } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function WarehouseIndex({ warehouses, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form Hook
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        city: '',
        address: '',
        is_active: true
    });

    // Handle Search
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.warehouses.index'), { search: searchTerm }, { preserveState: true });
        }
    };

    // Open Modal (Create)
    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    // Open Modal (Edit)
    const openEditModal = (wh) => {
        setIsEditMode(true);
        setEditingId(wh.id);
        setData({
            code: wh.code,
            name: wh.name,
            city: wh.city || '',
            address: wh.address || '',
            is_active: !!wh.is_active
        });
        clearErrors();
        setIsModalOpen(true);
    };

    // Submit Form
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            // Note: Route update tetap pakai 'warehouses.update' (Resource Controller standar)
            put(route('warehouses.update', editingId), {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            // Note: Route store tetap pakai 'warehouses.store'
            post(route('warehouses.store'), {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    // Handle Delete
    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus gudang ini?')) {
            router.delete(route('warehouses.destroy', id));
        }
    };

    return (
        <SettingsLayout title="Data Gudang">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                
                {/* Header Content */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Warehouse className="w-5 h-5 text-indigo-600" /> Daftar Lokasi Gudang
                        </h3>
                        <p className="text-slate-500 text-sm">Kelola lokasi penyimpanan fisik.</p>
                    </div>
                    
                    <button 
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition"
                    >
                        <Plus className="w-4 h-4" /> Tambah Gudang
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                        type="text" 
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 sm:text-sm transition"
                        placeholder="Cari kode, nama, atau kota..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>

                {/* Grid Gudang */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {warehouses.data.map((wh) => (
                        <div key={wh.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition group bg-white">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                        <Warehouse className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{wh.name}</h4>
                                        <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                                            {wh.code}
                                        </span>
                                    </div>
                                </div>
                                <div className={`h-2.5 w-2.5 rounded-full ${wh.is_active ? 'bg-green-500' : 'bg-red-500'}`} title={wh.is_active ? 'Aktif' : 'Non-Aktif'}></div>
                            </div>
                            
                            <div className="text-sm text-slate-500 mb-4 flex gap-2 items-start min-h-[40px]">
                                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                                <span className="line-clamp-2">{wh.address || '-'}, {wh.city || ''}</span>
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button onClick={() => openEditModal(wh)} className="flex-1 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-2 transition">
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={() => handleDelete(wh.id)} className="flex-1 py-1.5 rounded-lg bg-white border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition">
                                    <Trash2 className="w-3 h-3" /> Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {warehouses.data.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-slate-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
                            <Warehouse className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-medium">Belum ada gudang</h3>
                        <p className="text-slate-500 text-sm">Mulai tambahkan lokasi gudang pertama Anda.</p>
                    </div>
                )}

                {/* Pagination */}
                <div className="mt-6 flex justify-center gap-1">
                    {warehouses.links.map((link, k) => (
                        link.url ? (
                            <button 
                                key={k}
                                onClick={() => router.get(link.url)}
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

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">
                                {isEditMode ? 'Edit Data Gudang' : 'Tambah Gudang Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value="Kode Gudang *" />
                                    <TextInput 
                                        className="w-full mt-1 font-mono uppercase bg-slate-50 focus:bg-white transition" 
                                        placeholder="WH-001"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    />
                                    <InputError message={errors.code} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Kota" />
                                    <TextInput 
                                        className="w-full mt-1" 
                                        placeholder="Jakarta"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Nama Gudang *" />
                                <TextInput 
                                    className="w-full mt-1" 
                                    placeholder="Gudang Utama Cileungsi"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Alamat Lengkap" />
                                <textarea 
                                    className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    rows="3"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Jl. Raya Narogong..."
                                ></textarea>
                            </div>

                            {isEditMode && (
                                <div className="flex items-center gap-2 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 h-4 w-4"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-slate-700">Status Aktif</span>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition">Batal</button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 text-sm transition"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}