// NOTE: Kode ini sudah di-refactor untuk tampilan yang lebih modern dan user-friendly, dengan tambahan fitur pencarian, status aktif/non-aktif, dan desain card untuk setiap gudang. Modal form juga dibuat lebih menarik dengan layout yang bersih dan intuitif.
// Tidak dipakai lagi.

// import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
// import { Head, useForm, router } from '@inertiajs/react'; // Import router disini
// import { useState } from 'react';
// import { Warehouse, Plus, MapPin, Edit2, Trash2, Search, X, CheckCircle } from 'lucide-react';
// import TextInput from '@/Components/TextInput';
// import InputLabel from '@/Components/InputLabel';
// import InputError from '@/Components/InputError';

// export default function WarehouseIndex({ auth, warehouses, filters }) {
//     const [searchTerm, setSearchTerm] = useState(filters.search || '');
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [isEditMode, setIsEditMode] = useState(false);
//     const [editingId, setEditingId] = useState(null);

//     // Form Hook
//     const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
//         code: '',
//         name: '',
//         city: '',
//         address: '',
//         is_active: true
//     });

//     // Handle Search
//     const handleSearch = (e) => {
//         if (e.key === 'Enter') {
//             router.get(route('warehouses.index'), { search: searchTerm }, { preserveState: true });
//         }
//     };

//     // Open Modal (Create)
//     const openCreateModal = () => {
//         setIsEditMode(false);
//         setEditingId(null);
//         reset();
//         clearErrors();
//         setIsModalOpen(true);
//     };

//     // Open Modal (Edit)
//     const openEditModal = (wh) => {
//         setIsEditMode(true);
//         setEditingId(wh.id);
//         setData({
//             code: wh.code,
//             name: wh.name,
//             city: wh.city || '',
//             address: wh.address || '',
//             is_active: !!wh.is_active
//         });
//         clearErrors();
//         setIsModalOpen(true);
//     };

//     // Submit Form
//     const handleSubmit = (e) => {
//         e.preventDefault();
//         if (isEditMode) {
//             put(route('warehouses.update', editingId), {
//                 onSuccess: () => setIsModalOpen(false)
//             });
//         } else {
//             post(route('warehouses.store'), {
//                 onSuccess: () => setIsModalOpen(false)
//             });
//         }
//     };

//     // Handle Delete
//     const handleDelete = (id) => {
//         if (confirm('Yakin ingin menghapus gudang ini?')) {
//             router.delete(route('warehouses.destroy', id));
//         }
//     };

//     return (
//         <AuthenticatedLayout user={auth.user}>
//             <Head title="Manajemen Gudang" />

//             <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
//                 {/* Header */}
//                 <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
//                     <div>
//                         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
//                             <Warehouse className="text-indigo-600" /> Data Gudang
//                         </h2>
//                         <p className="text-slate-500 text-sm">Kelola lokasi penyimpanan stok Anda.</p>
//                     </div>
                    
//                     <button 
//                         onClick={openCreateModal}
//                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow-lg flex items-center gap-2 transition"
//                     >
//                         <Plus className="w-5 h-5" /> Tambah Gudang
//                     </button>
//                 </div>

//                 {/* Search Bar */}
//                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
//                     <Search className="w-5 h-5 text-slate-400" />
//                     <input 
//                         type="text" 
//                         className="w-full border-none focus:ring-0 text-slate-700 placeholder-slate-400"
//                         placeholder="Cari nama gudang, kode, atau kota..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         onKeyDown={handleSearch}
//                     />
//                 </div>

//                 {/* Grid Gudang (Card Style agar lebih visual) */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {warehouses.data.map((wh) => (
//                         <div key={wh.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
//                             <div className="flex justify-between items-start mb-4">
//                                 <div className="flex items-center gap-3">
//                                     <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
//                                         <Warehouse className="w-6 h-6" />
//                                     </div>
//                                     <div>
//                                         <h3 className="font-bold text-slate-800 text-lg">{wh.name}</h3>
//                                         <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
//                                             {wh.code}
//                                         </span>
//                                     </div>
//                                 </div>
//                                 <div className={`h-3 w-3 rounded-full ${wh.is_active ? 'bg-green-500' : 'bg-red-500'}`} title={wh.is_active ? 'Aktif' : 'Non-Aktif'}></div>
//                             </div>
                            
//                             <div className="space-y-2 mb-6">
//                                 <div className="flex items-start gap-2 text-sm text-slate-500">
//                                     <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
//                                     <span>{wh.address || '-'}, {wh.city || ''}</span>
//                                 </div>
//                             </div>

//                             <div className="flex gap-2 pt-4 border-t border-slate-50">
//                                 <button onClick={() => openEditModal(wh)} className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 flex items-center justify-center gap-2">
//                                     <Edit2 className="w-4 h-4" /> Edit
//                                 </button>
//                                 <button onClick={() => handleDelete(wh.id)} className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2">
//                                     <Trash2 className="w-4 h-4" /> Hapus
//                                 </button>
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 {/* --- MODAL FORM (Create/Edit) --- */}
//                 {isModalOpen && (
//                     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//                         <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
//                             <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
//                                 <h3 className="font-bold text-lg text-slate-800">
//                                     {isEditMode ? 'Edit Gudang' : 'Tambah Gudang Baru'}
//                                 </h3>
//                                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
//                                     <X className="w-5 h-5" />
//                                 </button>
//                             </div>

//                             <form onSubmit={handleSubmit} className="p-6 space-y-4">
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div>
//                                         <InputLabel value="Kode Gudang (Untuk Scan)" />
//                                         <TextInput 
//                                             className="w-full mt-1 font-mono uppercase" 
//                                             placeholder="WH-001"
//                                             value={data.code}
//                                             onChange={(e) => setData('code', e.target.value.toUpperCase())}
//                                         />
//                                         <InputError message={errors.code} className="mt-1" />
//                                         <p className="text-[10px] text-slate-400 mt-1">Kode ini yang akan dijadikan Barcode Rak.</p>
//                                     </div>
//                                     <div>
//                                         <InputLabel value="Kota" />
//                                         <TextInput 
//                                             className="w-full mt-1" 
//                                             placeholder="Jakarta"
//                                             value={data.city}
//                                             onChange={(e) => setData('city', e.target.value)}
//                                         />
//                                     </div>
//                                 </div>

//                                 <div>
//                                     <InputLabel value="Nama Gudang" />
//                                     <TextInput 
//                                         className="w-full mt-1" 
//                                         placeholder="Gudang Utama Cileungsi"
//                                         value={data.name}
//                                         onChange={(e) => setData('name', e.target.value)}
//                                     />
//                                     <InputError message={errors.name} className="mt-1" />
//                                 </div>

//                                 <div>
//                                     <InputLabel value="Alamat Lengkap" />
//                                     <textarea 
//                                         className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                                         rows="2"
//                                         value={data.address}
//                                         onChange={(e) => setData('address', e.target.value)}
//                                     ></textarea>
//                                 </div>

//                                 {isEditMode && (
//                                     <div className="flex items-center gap-2 mt-2">
//                                         <input 
//                                             type="checkbox" 
//                                             className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
//                                             checked={data.is_active}
//                                             onChange={(e) => setData('is_active', e.target.checked)}
//                                         />
//                                         <span className="text-sm text-slate-600">Gudang Aktif</span>
//                                     </div>
//                                 )}

//                                 <div className="pt-4 flex justify-end gap-3">
//                                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
//                                     <button 
//                                         type="submit" 
//                                         disabled={processing}
//                                         className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2"
//                                     >
//                                         {processing ? 'Menyimpan...' : 'Simpan Gudang'}
//                                     </button>
//                                 </div>
//                             </form>
//                         </div>
//                     </div>
//                 )}

//             </div>
//         </AuthenticatedLayout>
//     );
// }