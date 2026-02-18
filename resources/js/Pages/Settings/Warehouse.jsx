import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Warehouse, Plus, Edit, Trash2, Search, X, Save, Scale 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function WarehouseIndex({ warehouses = { data: [] }, units = [], filters = {} }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N

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
            title: t(`Hapus Gudang ${wh.name}?`),
            text: t("Data stok di dalamnya mungkin akan ikut terhapus atau error."),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33333',
            confirmButtonText: t('Ya, Hapus'),
            cancelButtonText: t('Batal')
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
        Swal.fire({
            title: t(`Hapus satuan "${unit.name}"?`),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: t('Ya, Hapus!'),
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                destroyU(route('settings.units.destroy', unit.id));
            }
        });
    };

    return (
        <SettingsLayout title={t('Gudang & Satuan Unit')}>
            <Head title={t('Gudang & Unit')} />

            <div className="space-y-8">
                
                {/* BAGIAN 1: UNIT (ATAS) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50/50 dark:bg-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Scale className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('Satuan Unit')}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('Kelola satuan barang (Pcs, Box, Kg)')}</p>
                            </div>
                        </div>
                        <button 
                            onClick={openCreateUnit} 
                            className="h-10 px-4 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4" /> {t('Tambah Unit')}
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-3">
                            {units.length > 0 ? (
                                units.map((unit) => (
                                    <div key={unit.id} className="group relative flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all">
                                        <div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{unit.short_name}</span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({unit.name})</span>
                                        </div>
                                        <div className="flex gap-1 pl-2 border-l border-slate-200 dark:border-slate-700 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditUnit(unit)} className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => deleteUnit(unit)} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500 italic">{t('Belum ada data unit.')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* BAGIAN 2: GUDANG (BAWAH) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                <Warehouse className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{t('Data Gudang')}</h3>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    className="w-full h-10 pl-9 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400" 
                                    placeholder={t('Cari gudang...')} 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    onKeyDown={handleSearch} 
                                />
                            </div>
                            <button onClick={openCreateWarehouse} className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition w-full sm:w-auto">
                                <Plus className="w-4 h-4" /> {t('Baru')}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[40vh]">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">{t('Nama Gudang')}</th>
                                    <th className="px-6 py-4">{t('Kode')}</th>
                                    <th className="px-6 py-4">{t('Alamat')}</th>
                                    <th className="px-6 py-4 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {warehouses.data.length > 0 ? (
                                    warehouses.data.map((wh) => (
                                        <tr key={wh.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <Warehouse className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {wh.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 w-fit rounded px-2 py-0.5 border border-indigo-100 dark:border-indigo-800/50">
                                                    {wh.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{wh.address || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={() => openEditWarehouse(wh)} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition" title={t('Edit')}>
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => deleteWarehouse(wh)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title={t('Hapus')}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                            {t('Tidak ada data gudang.')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- CUSTOM MODAL GUDANG --- */}
            {isWarehouseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Warehouse className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
                                {isEditMode ? t('Edit Data Gudang') : t('Tambah Gudang Baru')}
                            </h3>
                            <button onClick={() => setIsWarehouseModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <form onSubmit={submitWarehouse} className="p-6 space-y-5">
                            <div>
                                <InputLabel value={t('Nama Gudang *')} className="dark:text-slate-300" />
                                <TextInput className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" value={dataW.name} onChange={(e) => setDataW('name', e.target.value)} autoFocus required placeholder={t('Contoh: Gudang Pusat')} />
                                <InputError message={errorsW.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={t('Kode Gudang *')} className="dark:text-slate-300" />
                                <TextInput className="w-full mt-1 uppercase font-mono bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" value={dataW.code} onChange={(e) => setDataW('code', e.target.value.toUpperCase())} required placeholder="W-001" />
                                <InputError message={errorsW.code} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={t('Alamat Lengkap')} className="dark:text-slate-300" />
                                <TextInput className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" value={dataW.address} onChange={(e) => setDataW('address', e.target.value)} placeholder={t('Jalan Raya...')} />
                            </div>

                            {/* Footer Modal */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsWarehouseModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition">
                                    {t('Batal')}
                                </button>
                                <button type="submit" disabled={processingW} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition disabled:opacity-50">
                                    <Save className="w-4 h-4" /> {processingW ? t('Menyimpan...') : t('Simpan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- CUSTOM MODAL UNIT --- */}
            {isUnitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
                                {editingUnit ? t('Edit Unit') : t('Tambah Unit Baru')}
                            </h3>
                            <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <form onSubmit={submitUnit} className="p-6 space-y-5">
                            <div>
                                <InputLabel value={t('Nama Unit (Panjang) *')} className="dark:text-slate-300" />
                                <TextInput className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" placeholder={t('Contoh: Pieces, Kilogram')} value={dataU.name} onChange={(e) => setDataU('name', e.target.value)} autoFocus required />
                                <InputError message={errorsU.name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={t('Singkatan (Short Name) *')} className="dark:text-slate-300" />
                                <TextInput className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" placeholder={t('Contoh: Pcs, Kg')} value={dataU.short_name} onChange={(e) => setDataU('short_name', e.target.value)} required />
                                <InputError message={errorsU.short_name} className="mt-1" />
                            </div>

                            {/* Footer Modal */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition">
                                    {t('Batal')}
                                </button>
                                <button type="submit" disabled={processingU} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition disabled:opacity-50">
                                    <Save className="w-4 h-4" /> {processingU ? t('Menyimpan...') : t('Simpan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </SettingsLayout>
    );
}