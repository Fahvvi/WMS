import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, Plus, User, Shield, Mail, Lock, Edit, Trash2, X, Save, 
    IdCard, CheckCircle2 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

export default function UserIndex({ users, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        nip: '', // Field NIP Baru
        email: '',
        role: 'staff',
        password: '',
        password_confirmation: ''
    });

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.users.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    // --- ACTIONS ---
    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingUser(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setIsEditMode(true);
        setEditingUser(user);
        setData({
            name: user.name,
            nip: user.nip || '', // Load NIP (handle jika null)
            email: user.email,
            role: user.role || 'staff',
            password: '',
            password_confirmation: ''
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const handleDelete = (user) => {
        Swal.fire({
            title: 'Hapus User?',
            text: `Akun "${user.name}" akan dihapus permanen.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('settings.users.destroy', user.id), {
                    onSuccess: () => Swal.fire('Terhapus!', 'User berhasil dihapus.', 'success')
                });
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('settings.users.update', editingUser.id), { onSuccess: () => setIsModalOpen(false) });
        } else {
            post(route('settings.users.store'), { onSuccess: () => setIsModalOpen(false) });
        }
    };

    const getRoleBadge = (role) => {
        switch(role) {
            case 'superadmin': return <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-bold uppercase border border-purple-200">Super Admin</span>;
            case 'spv': return <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold uppercase border border-blue-200">Supervisor</span>;
            default: return <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase border border-slate-200">Staff</span>;
        }
    };

    return (
        <SettingsLayout title="Manajemen User">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* Header Toolbar */}
                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex-1 w-full sm:w-auto relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="Cari nama, NIP, atau email..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            onKeyDown={handleSearch} 
                        />
                    </div>
                    <button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition">
                        <Plus className="w-4 h-4" /> User Baru
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Pegawai (Nama & NIP)</th>
                                <th className="px-6 py-3">Kontak Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold uppercase shadow-sm border border-indigo-200">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    {/* Tampilan NIP di Tabel */}
                                                    <div className="text-xs font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <IdCard className="w-3 h-3" /> 
                                                        {user.nip || <span className="text-slate-300 italic">Tanpa NIP</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-slate-300" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(user)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">Belum ada data user.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM (GRID LAYOUT) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        
                        {/* Modal Header */}
                        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                    {isEditMode ? <Edit className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                                    {isEditMode ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Lengkapi identitas NIP untuk login alternatif.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6 md:p-8 space-y-8">
                                
                                {/* SECTION 1: IDENTITAS (GRID 2 KOLOM) */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <IdCard className="w-4 h-4" /> Identitas Pegawai
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Nama */}
                                        <div>
                                            <InputLabel value="Nama Lengkap *" />
                                            <div className="relative mt-1">
                                                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                                <TextInput className="w-full pl-10 py-2.5 rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Contoh: Budi Santoso" value={data.name} onChange={e => setData('name', e.target.value)} required autoFocus />
                                            </div>
                                            <InputError message={errors.name} className="mt-1" />
                                        </div>

                                        {/* NIP */}
                                        <div>
                                            <InputLabel value="Nomor Induk Pegawai (NIP) *" />
                                            <div className="relative mt-1">
                                                <IdCard className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                                <TextInput className="w-full pl-10 py-2.5 rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 font-mono" placeholder="Contoh: 2024001" value={data.nip} onChange={e => setData('nip', e.target.value)} required />
                                            </div>
                                            <InputError message={errors.nip} className="mt-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: AKUN & AKSES */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <Shield className="w-4 h-4" /> Akun & Keamanan
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Email */}
                                        <div className="md:col-span-2">
                                            <InputLabel value="Email Login *" />
                                            <div className="relative mt-1">
                                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                                <TextInput type="email" className="w-full pl-10 py-2.5 rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="email@perusahaan.com" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                            </div>
                                            <InputError message={errors.email} className="mt-1" />
                                        </div>

                                        {/* Role */}
                                        <div className="md:col-span-2">
                                            <InputLabel value="Level Akses (Role) *" />
                                            <div className="relative mt-1">
                                                <Shield className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                                <select 
                                                    className="w-full pl-10 py-2.5 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm appearance-none bg-white"
                                                    value={data.role}
                                                    onChange={e => setData('role', e.target.value)}
                                                >
                                                    <option value="staff">Staff (Hanya Scan In/Out)</option>
                                                    <option value="spv">Supervisor (Bisa Lihat Laporan)</option>
                                                    <option value="superadmin">Super Admin (Akses Penuh)</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                </div>
                                            </div>
                                            <InputError message={errors.role} className="mt-1" />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                        {isEditMode && (
                                            <div className="flex items-start gap-2 mb-4">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                                                <p className="text-xs text-slate-500">Biarkan password kosong jika tidak ingin mengubahnya.</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <InputLabel value={isEditMode ? "Password Baru" : "Password *"} />
                                                <div className="relative mt-1">
                                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                                    <TextInput type="password" className="w-full pl-10 py-2.5 rounded-xl border-slate-300" placeholder="******" value={data.password} onChange={e => setData('password', e.target.value)} />
                                                </div>
                                                <InputError message={errors.password} className="mt-1" />
                                            </div>
                                            <div>
                                                <InputLabel value="Ulangi Password" />
                                                <div className="relative mt-1">
                                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                                    <TextInput type="password" className="w-full pl-10 py-2.5 rounded-xl border-slate-300" placeholder="******" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-10">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-xl transition">Batal</button>
                                <button type="submit" disabled={processing} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
                                    <Save className="w-4 h-4" /> {isEditMode ? 'Simpan Perubahan' : 'Buat User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}