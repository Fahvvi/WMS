import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Warehouse, Plus, MapPin, Edit, Trash2, Search, X, Save, Scale 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

// Tambahkan default props agar tidak error jika data kosong
export default function WarehouseIndex({ warehouses = { data: [] }, units = [], filters = {} }) {
    
    // --- STATE ---
    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);

    // --- FORM HOOKS ---
    const { 
        data: dataW, setData: setDataW, post: postW, put: putW, 
        delete: destroyW, processing: processingW, errors: errorsW, 
        reset: resetW, clearErrors: clearErrorsW 
    } = useForm({ name: '', code: '', address: '' });

    const { 
        data: dataU, setData: setDataU, post: postU, put: putU, 
        delete: destroyU, processing: processingU, errors: errorsU, 
        reset: resetU, clearErrors: clearErrorsU 
    } = useForm({ name: '', short_name: '' });

    // --- HANDLERS GUDANG ---
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.warehouses.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    const openCreateWarehouse = () => {
        setIsEditMode(false);
        setEditingWarehouse(null);
        resetW();
        clearErrorsW();
        setIsWarehouseModalOpen(true);
    };

    const openEditWarehouse = (wh) => {
        setIsEditMode(true);
        setEditingWarehouse(wh);
        setDataW({ name: wh.name, code: wh.code, address: wh.address || '' });
        clearErrorsW();
        setIsWarehouseModalOpen(true);
    };

    const submitWarehouse = (e) => {
        e.preventDefault();
        if (isEditMode) {
            putW(route('warehouses.update', editingWarehouse.id), { onSuccess: () => setIsWarehouseModalOpen(false) });
        } else {
            postW(route('warehouses.store'), { onSuccess: () => setIsWarehouseModalOpen(false) });
        }
    };

    const deleteWarehouse = (wh) => {
        Swal.fire({
            title: `Hapus Gudang ${wh.name}?`,
            text: "Data stok di dalamnya mungkin akan ikut terhapus atau error.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33333',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                destroyW(route('warehouses.destroy', wh.id));
            }
        });
    };

    // --- HANDLERS UNIT ---
    const openCreateUnit = () => {
        setEditingUnit(null);
        resetU();
        clearErrorsU();
        setIsUnitModalOpen(true);
    };

    const openEditUnit = (unit) => {
        setEditingUnit(unit);
        setDataU({ name: unit.name, short_name: unit.short_name });
        clearErrorsU();
        setIsUnitModalOpen(true);
    };

    const submitUnit = (e) => {
        e.preventDefault();
        if (editingUnit) {
            putU(route('settings.units.update', editingUnit.id), { onSuccess: () => setIsUnitModalOpen(false) });
        } else {
            postU(route('settings.units.store'), { onSuccess: () => setIsUnitModalOpen(false) });
        }
    };

    const deleteUnit = (unit) => {
        if(confirm(`Hapus satuan "${unit.name}"?`)) {
            destroyU(route('settings.units.destroy', unit.id));
        }
    };

    return (
        <SettingsLayout title="Gudang & Satuan Unit">
            <Head title="Gudang & Unit" />

            <div className="space-y-8">
                
                {/* BAGIAN 1: UNIT (ATAS) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Scale className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Satuan Unit</h3>
                                <p className="text-xs text-slate-500">Kelola satuan barang (Pcs, Box, Kg)</p>
                            </div>
                        </div>
                        <button onClick={openCreateUnit} className="bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-1 transition">
                            <Plus className="w-4 h-4" /> Tambah Unit
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-3">
                            {units.length > 0 ? (
                                units.map((unit) => (
                                    <div key={unit.id} className="group relative flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 hover:border-indigo-300 hover:shadow-md transition-all">
                                        <div>
                                            <span className="font-bold text-slate-700">{unit.short_name}</span>
                                            <span className="text-xs text-slate-400 ml-1">({unit.name})</span>
                                        </div>
                                        <div className="flex gap-1 pl-2 border-l border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditUnit(unit)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit className="w-3 h-3" /></button>
                                            <button onClick={() => deleteUnit(unit)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">Belum ada data unit.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* BAGIAN 2: GUDANG (BAWAH) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <Warehouse className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">Data Gudang</h3>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                                    placeholder="Cari gudang..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    onKeyDown={handleSearch} 
                                />
                            </div>
                            <button onClick={openCreateWarehouse} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition">
                                <Plus className="w-4 h-4" /> Baru
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Nama Gudang</th>
                                    <th className="px-6 py-3">Kode</th>
                                    <th className="px-6 py-3">Alamat</th>
                                    <th className="px-6 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {warehouses.data.length > 0 ? (
                                    warehouses.data.map((wh) => (
                                        <tr key={wh.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-3 font-bold text-slate-800 flex items-center gap-2">
                                                <Warehouse className="w-4 h-4 text-slate-400" /> {wh.name}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-indigo-600 bg-indigo-50 w-fit rounded px-2">{wh.code}</td>
                                            <td className="px-6 py-3">{wh.address || '-'}</td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEditWarehouse(wh)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteWarehouse(wh)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Tidak ada data gudang.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- CUSTOM MODAL GUDANG (Desain Baru) --- */}
            {isWarehouseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Warehouse className="w-5 h-5 text-indigo-600" /> 
                                {isEditMode ? 'Edit Data Gudang' : 'Tambah Gudang Baru'}
                            </h3>
                            <button onClick={() => setIsWarehouseModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <form onSubmit={submitWarehouse} className="p-6 space-y-5">
                            <div>
                                <InputLabel value="Nama Gudang *" />
                                <TextInput className="w-full mt-1" value={dataW.name} onChange={(e) => setDataW('name', e.target.value)} autoFocus required placeholder="Contoh: Gudang Pusat" />
                                <InputError message={errorsW.name} />
                            </div>
                            <div>
                                <InputLabel value="Kode Gudang *" />
                                <TextInput className="w-full mt-1 uppercase font-mono" value={dataW.code} onChange={(e) => setDataW('code', e.target.value.toUpperCase())} required placeholder="W-001" />
                                <InputError message={errorsW.code} />
                            </div>
                            <div>
                                <InputLabel value="Alamat Lengkap" />
                                <TextInput className="w-full mt-1" value={dataW.address} onChange={(e) => setDataW('address', e.target.value)} placeholder="Jalan Raya..." />
                            </div>

                            {/* Footer Modal */}
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsWarehouseModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={processingW} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition disabled:opacity-50">
                                    <Save className="w-4 h-4" /> {processingW ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- CUSTOM MODAL UNIT (Desain Baru) --- */}
            {isUnitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-600" /> 
                                {editingUnit ? 'Edit Unit' : 'Tambah Unit Baru'}
                            </h3>
                            <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <form onSubmit={submitUnit} className="p-6 space-y-5">
                            <div>
                                <InputLabel value="Nama Unit (Panjang) *" />
                                <TextInput className="w-full mt-1" placeholder="Contoh: Pieces, Kilogram" value={dataU.name} onChange={(e) => setDataU('name', e.target.value)} autoFocus required />
                                <InputError message={errorsU.name} />
                            </div>
                            <div>
                                <InputLabel value="Singkatan (Short Name) *" />
                                <TextInput className="w-full mt-1" placeholder="Contoh: Pcs, Kg" value={dataU.short_name} onChange={(e) => setDataU('short_name', e.target.value)} required />
                                <InputError message={errorsU.short_name} />
                            </div>

                            {/* Footer Modal */}
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={processingU} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition disabled:opacity-50">
                                    <Save className="w-4 h-4" /> {processingU ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </SettingsLayout>
    );
}