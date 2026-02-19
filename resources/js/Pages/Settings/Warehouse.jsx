import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import React, { useState, useRef } from 'react';
import { 
    Warehouse, Plus, Edit, Trash2, Search, X, Save, Scale, 
    ChevronDown, ChevronRight, MapPin, Layers, QrCode, Printer 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';
import { useLaravelReactI18n } from 'laravel-react-i18n'; 
import { QRCodeSVG } from 'qrcode.react'; // <--- IMPORT LIBRARY QR CODE

export default function WarehouseIndex({ warehouses = { data: [] }, units = [], filters = {} }) {
    const { t } = useLaravelReactI18n();

    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [expandedRows, setExpandedRows] = useState([]); // State untuk Accordion

    // State Modal Gudang
    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);

    // State Modal Unit
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);

    // State Modal Lokasi (Rak)
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isEditLocationMode, setIsEditLocationMode] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);

    // --- STATE MODAL QR CODE ---
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrData, setQrData] = useState({ value: '', label: '', type: '' });

    // --- FORM HOOKS ---
    // 1. Gudang
    const { 
        data: dataW, setData: setDataW, post: postW, put: putW, 
        delete: destroyW, processing: processingW, errors: errorsW, 
        reset: resetW, clearErrors: clearErrorsW 
    } = useForm({ name: '', code: '', address: '' });

    // 2. Unit
    const { 
        data: dataU, setData: setDataU, post: postU, put: putU, 
        delete: destroyU, processing: processingU, errors: errorsU, 
        reset: resetU, clearErrors: clearErrorsU 
    } = useForm({ name: '', short_name: '' });

    // 3. Lokasi (Rak)
    const {
        data: dataL, setData: setDataL, post: postL, put: putL,
        delete: destroyL, processing: processingL, errors: errorsL,
        reset: resetL, clearErrors: clearErrorsL
    } = useForm({ warehouse_id: '', code: '', type: 'storage' });

    // --- HANDLERS UTAMA ---
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.warehouses.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    const toggleExpand = (id) => {
        if (expandedRows.includes(id)) {
            setExpandedRows(expandedRows.filter(rowId => rowId !== id));
        } else {
            setExpandedRows([...expandedRows, id]);
        }
    };

    // --- CRUD GUDANG ---
    const openCreateWarehouse = () => {
        setIsEditMode(false); setEditingWarehouse(null); resetW(); clearErrorsW(); setIsWarehouseModalOpen(true);
    };
    const openEditWarehouse = (wh) => {
        setIsEditMode(true); setEditingWarehouse(wh); setDataW({ name: wh.name, code: wh.code, address: wh.address || '' }); clearErrorsW(); setIsWarehouseModalOpen(true);
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
            title: t('Hapus Gudang?'),
            html: t(`Hapus gudang <b>"${wh.name}"</b>? Data rak & stok di dalamnya berisiko hilang.`),
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: t('Ya, Hapus')
        }).then((res) => { if (res.isConfirmed) destroyW(route('warehouses.destroy', wh.id)); });
    };

    // --- CRUD UNIT ---
    const openCreateUnit = () => { setEditingUnit(null); resetU(); clearErrorsU(); setIsUnitModalOpen(true); };
    const openEditUnit = (unit) => { setEditingUnit(unit); setDataU({ name: unit.name, short_name: unit.short_name }); clearErrorsU(); setIsUnitModalOpen(true); };
    const submitUnit = (e) => {
        e.preventDefault();
        if (editingUnit) {
            putU(route('settings.units.update', editingUnit.id), { onSuccess: () => setIsUnitModalOpen(false) });
        } else {
            postU(route('settings.units.store'), { onSuccess: () => setIsUnitModalOpen(false) });
        }
    };
    const deleteUnit = (unit) => {
        Swal.fire({ title: t('Hapus Unit?'), text: t(`Hapus "${unit.name}"?`), icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: t('Ya') })
            .then((res) => { if (res.isConfirmed) destroyU(route('settings.units.destroy', unit.id)); });
    };

    // --- CRUD LOKASI (RAK) ---
    const openCreateLocation = (warehouseId) => {
        setIsEditLocationMode(false); setEditingLocation(null); setSelectedWarehouseId(warehouseId);
        setDataL({ warehouse_id: warehouseId, code: '', type: 'storage' }); // Reset form
        clearErrorsL(); setIsLocationModalOpen(true);
    };
    const openEditLocation = (loc) => {
        setIsEditLocationMode(true); setEditingLocation(loc);
        setDataL({ warehouse_id: loc.warehouse_id, code: loc.code, type: loc.type });
        clearErrorsL(); setIsLocationModalOpen(true);
    };
    const submitLocation = (e) => {
        e.preventDefault();
        if (isEditLocationMode) {
            putL(route('locations.update', editingLocation.id), { onSuccess: () => setIsLocationModalOpen(false) });
        } else {
            postL(route('locations.store'), { onSuccess: () => setIsLocationModalOpen(false) });
        }
    };
    const deleteLocation = (loc) => {
        Swal.fire({ title: t('Hapus Rak?'), text: t(`Hapus Rak "${loc.code}"? Stok di rak ini harus kosong.`), icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: t('Ya') })
            .then((res) => { if (res.isConfirmed) destroyL(route('locations.destroy', loc.id)); });
    };

    // --- QR CODE HANDLERS ---
    const openQRWarehouse = (wh) => {
        setQrData({ value: wh.code, label: wh.name, type: 'GUDANG' });
        setIsQRModalOpen(true);
    };

    const openQRLocation = (loc) => {
        setQrData({ value: loc.code, label: loc.code, type: 'RAK / LOKASI' });
        setIsQRModalOpen(true);
    };

    const printQR = () => {
        const printContent = document.getElementById('qr-print-area').innerHTML;
        const win = window.open('', '', 'height=500,width=500');
        win.document.write('<html><head><title>Print QR</title>');
        win.document.write('<style>body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; } .qr-container { border: 2px solid #000; padding: 20px; border-radius: 10px; } h2 { margin-bottom: 5px; } p { margin-top: 5px; font-weight: bold; font-size: 24px; }</style>');
        win.document.write('</head><body>');
        win.document.write(printContent);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    };

    return (
        <SettingsLayout title={t('Gudang & Satuan Unit')}>
            <Head title={t('Gudang & Unit')} />

            <div className="space-y-8">
                
                {/* BAGIAN 1: UNIT (ATAS) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50/50 dark:bg-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><Scale className="w-5 h-5" /></div>
                            <div><h3 className="font-bold text-slate-800 dark:text-slate-100">{t('Satuan Unit')}</h3></div>
                        </div>
                        <button onClick={openCreateUnit} className="h-9 px-4 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition">
                            <Plus className="w-3.5 h-3.5" /> {t('Tambah Unit')}
                        </button>
                    </div>
                    <div className="p-6 flex flex-wrap gap-3">
                        {units.length > 0 ? units.map((unit) => (
                            <div key={unit.id} className="group flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                                <div><span className="font-bold text-slate-700 dark:text-slate-200">{unit.short_name}</span> <span className="text-xs text-slate-400">({unit.name})</span></div>
                                <div className="flex gap-1 pl-2 border-l border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditUnit(unit)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit className="w-3 h-3" /></button>
                                    <button onClick={() => deleteUnit(unit)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                        )) : <p className="text-sm text-slate-400 italic">{t('Belum ada data unit.')}</p>}
                    </div>
                </div>

                {/* BAGIAN 2: GUDANG (ACCORDION STYLE) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                    <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><Warehouse className="w-5 h-5" /></div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{t('Data Gudang & Rak')}</h3>
                        </div>
                        <div className="flex gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" className="w-full h-10 pl-9 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-indigo-500 transition-colors" placeholder={t('Cari gudang...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearch} />
                            </div>
                            <button onClick={openCreateWarehouse} className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition shrink-0"><Plus className="w-4 h-4" /> {t('Gudang Baru')}</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[40vh]">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 w-10"></th>
                                    <th className="px-6 py-4">{t('Nama Gudang')}</th>
                                    <th className="px-6 py-4">{t('Kode')}</th>
                                    <th className="px-6 py-4">{t('Alamat')}</th>
                                    <th className="px-6 py-4 text-center">{t('Aksi')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {warehouses.data.length > 0 ? warehouses.data.map((wh) => (
                                    <React.Fragment key={wh.id}>
                                        {/* PARENT ROW: GUDANG */}
                                        <tr className={`transition-colors ${expandedRows.includes(wh.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                                            <td className="px-6 py-4 text-center cursor-pointer" onClick={() => toggleExpand(wh.id)}>
                                                {expandedRows.includes(wh.id) 
                                                    ? <ChevronDown className="w-5 h-5 text-indigo-500" /> 
                                                    : <ChevronRight className="w-5 h-5 text-slate-400" />
                                                }
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 cursor-pointer" onClick={() => toggleExpand(wh.id)}>
                                                <div className="flex items-center gap-2"><Warehouse className="w-4 h-4 text-slate-400" /> {wh.name}</div>
                                            </td>
                                            <td className="px-6 py-4"><span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded px-2 py-0.5 border border-indigo-100 dark:border-indigo-800/50">{wh.code}</span></td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{wh.address || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    {/* TOMBOL QR CODE GUDANG */}
                                                    <button onClick={() => openQRWarehouse(wh)} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg mr-1" title={t('Lihat QR Code')}>
                                                        <QrCode className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openCreateLocation(wh.id)} className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg mr-2 border border-indigo-100" title={t('Tambah Rak')}>
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openEditWarehouse(wh)} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteWarehouse(wh)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* CHILD ROW: RAK / LOKASI (Expanded) */}
                                        {expandedRows.includes(wh.id) && (
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <td colSpan="5" className="px-6 py-4 pl-16">
                                                    <div className="border-l-2 border-indigo-200 dark:border-indigo-800 pl-6 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                                <Layers className="w-4 h-4" /> {t('Daftar Rak / Bin pada')} {wh.name}
                                                            </h4>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {wh.locations && wh.locations.length > 0 ? wh.locations.map(loc => (
                                                                <div key={loc.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition group">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-2 rounded-lg ${loc.type === 'storage' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                            <MapPin className="w-4 h-4" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{loc.code}</div>
                                                                            <div className="text-[10px] uppercase text-slate-400 font-bold">{t(loc.type)}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {/* TOMBOL QR CODE RAK */}
                                                                        <button onClick={() => openQRLocation(loc)} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded" title={t('QR Code Rak')}>
                                                                            <QrCode className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button onClick={() => openEditLocation(loc)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                                                                        <button onClick={() => deleteLocation(loc)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <div className="col-span-full py-4 text-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl">
                                                                    {t('Belum ada rak/lokasi di gudang ini.')}
                                                                    <button onClick={() => openCreateLocation(wh.id)} className="ml-2 text-indigo-600 font-bold hover:underline">{t('Buat Rak')}</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">{t('Tidak ada data gudang.')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODAL GUDANG --- */}
            {isWarehouseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2"><Warehouse className="w-5 h-5 text-indigo-600" /> {isEditMode ? t('Edit Gudang') : t('Tambah Gudang')}</h3>
                            <button onClick={() => setIsWarehouseModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={submitWarehouse} className="p-6 space-y-4">
                            <div><InputLabel value={t('Nama Gudang *')} className="dark:text-slate-300" /><TextInput className="w-full mt-1 dark:bg-slate-900 dark:text-white dark:border-slate-600" value={dataW.name} onChange={(e) => setDataW('name', e.target.value)} required placeholder="Gudang Utama" /><InputError message={errorsW.name} /></div>
                            <div><InputLabel value={t('Kode Gudang *')} className="dark:text-slate-300" /><TextInput className="w-full mt-1 uppercase font-mono dark:bg-slate-900 dark:text-white dark:border-slate-600" value={dataW.code} onChange={(e) => setDataW('code', e.target.value.toUpperCase())} required placeholder="WH-01" /><InputError message={errorsW.code} /></div>
                            <div><InputLabel value={t('Alamat')} className="dark:text-slate-300" /><TextInput className="w-full mt-1 dark:bg-slate-900 dark:text-white dark:border-slate-600" value={dataW.address} onChange={(e) => setDataW('address', e.target.value)} placeholder="Jl. Raya..." /></div>
                            <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={() => setIsWarehouseModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold">{t('Batal')}</button><button type="submit" disabled={processingW} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex gap-2 items-center hover:bg-indigo-700 disabled:opacity-50"><Save className="w-4 h-4"/> {t('Simpan')}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL UNIT --- */}
            {isUnitModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2"><Scale className="w-5 h-5 text-indigo-600" /> {editingUnit ? t('Edit Unit') : t('Tambah Unit')}</h3>
                            <button onClick={() => setIsUnitModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={submitUnit} className="p-6 space-y-4">
                            <div><InputLabel value={t('Nama Unit *')} className="dark:text-slate-300" /><TextInput className="w-full mt-1 dark:bg-slate-900 dark:text-white dark:border-slate-600" value={dataU.name} onChange={(e) => setDataU('name', e.target.value)} required placeholder="Pieces" /><InputError message={errorsU.name} /></div>
                            <div><InputLabel value={t('Singkatan *')} className="dark:text-slate-300" /><TextInput className="w-full mt-1 dark:bg-slate-900 dark:text-white dark:border-slate-600" value={dataU.short_name} onChange={(e) => setDataU('short_name', e.target.value)} required placeholder="Pcs" /><InputError message={errorsU.short_name} /></div>
                            <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold">{t('Batal')}</button><button type="submit" disabled={processingU} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex gap-2 items-center hover:bg-indigo-700 disabled:opacity-50"><Save className="w-4 h-4"/> {t('Simpan')}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL LOKASI (RAK) BARU --- */}
            {isLocationModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
                                {isEditLocationMode ? t('Edit Rak / Bin') : t('Tambah Rak Baru')}
                            </h3>
                            <button onClick={() => setIsLocationModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={submitLocation} className="p-6 space-y-4">
                            {/* Hidden Warehouse ID */}
                            <input type="hidden" value={dataL.warehouse_id} />
                            
                            <div>
                                <InputLabel value={t('Kode Rak / Lokasi *')} className="dark:text-slate-300" />
                                <TextInput className="w-full mt-1 font-mono uppercase dark:bg-slate-900 dark:text-white dark:border-slate-600" value={dataL.code} onChange={(e) => setDataL('code', e.target.value.toUpperCase())} required placeholder="R-A-01" autoFocus />
                                <InputError message={errorsL.code} />
                                <p className="text-xs text-slate-400 mt-1">{t('Contoh: RAK-A-LEVEL-1')}</p>
                            </div>
                            
                            <div>
                                <InputLabel value={t('Tipe Lokasi')} className="dark:text-slate-300" />
                                <select 
                                    className="w-full mt-1 border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm"
                                    value={dataL.type}
                                    onChange={(e) => setDataL('type', e.target.value)}
                                >
                                    <option value="storage">Storage (Penyimpanan)</option>
                                    <option value="receiving">Receiving (Penerimaan)</option>
                                    <option value="shipping">Shipping (Pengiriman)</option>
                                    <option value="quarantine">Quarantine (Karantina)</option>
                                </select>
                                <InputError message={errorsL.type} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsLocationModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold">{t('Batal')}</button>
                                <button type="submit" disabled={processingL} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex gap-2 items-center hover:bg-indigo-700 disabled:opacity-50">
                                    <Save className="w-4 h-4"/> {t('Simpan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL QR CODE --- */}
            {isQRModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setIsQRModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-6 h-6" /></button>
                        
                        {/* Area yang akan dicetak */}
                        <div id="qr-print-area" className="qr-container flex flex-col items-center justify-center border-4 border-slate-900 dark:border-slate-600 p-6 rounded-xl bg-white">
                            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest mb-2">{qrData.type}</h2>
                            <QRCodeSVG value={qrData.value} size={200} level="H" />
                            <p className="text-3xl font-mono font-bold text-slate-900 mt-4 tracking-wider">{qrData.value}</p>
                            <p className="text-xs text-slate-500 mt-1">{qrData.label}</p>
                        </div>

                        <button onClick={printQR} className="w-full mt-6 bg-slate-900 dark:bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 dark:hover:bg-indigo-700 transition shadow-lg">
                            <Printer className="w-5 h-5" /> {t('Cetak QR Code')}
                        </button>
                    </div>
                </div>
            )}

        </SettingsLayout>
    );
}