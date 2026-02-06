import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, Plus, User, Shield, Mail, Lock, Edit, Trash2, X, Save 
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
            email: user.email,
            role: user.role || 'staff',
            password: '', // Password dikosongkan saat edit
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

    // Helper untuk Warna Badge Role
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
                            placeholder="Cari nama user..." 
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
                                <th className="px-6 py-3">Nama Lengkap</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Level (Role)</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold uppercase">
                                                {user.name.charAt(0)}
                                            </div>
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{user.email}</td>
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

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-600" /> {isEditMode ? 'Edit User' : 'Tambah User'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            
                            {/* Nama */}
                            <div>
                                <InputLabel value="Nama Lengkap *" />
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <TextInput className="w-full pl-9 mt-1" value={data.name} onChange={e => setData('name', e.target.value)} required autoFocus />
                                </div>
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            {/* Email */}
                            <div>
                                <InputLabel value="Email Login *" />
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <TextInput type="email" className="w-full pl-9 mt-1" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                </div>
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            {/* Role Selection */}
                            <div>
                                <InputLabel value="Level Akses (Role) *" />
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <select 
                                        className="w-full pl-9 mt-1 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        value={data.role}
                                        onChange={e => setData('role', e.target.value)}
                                    >
                                        <option value="staff">Staff (Hanya Scan In/Out)</option>
                                        <option value="spv">Supervisor (Bisa Lihat Laporan)</option>
                                        <option value="superadmin">Super Admin (Akses Penuh)</option>
                                    </select>
                                </div>
                                <InputError message={errors.role} className="mt-1" />
                            </div>

                            {/* Password Section */}
                            <div className="pt-2 border-t border-slate-100 mt-2">
                                {isEditMode && (
                                    <p className="text-xs text-orange-600 mb-2 font-bold bg-orange-50 p-2 rounded border border-orange-100">
                                        Biarkan kosong jika tidak ingin mengganti password.
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value={isEditMode ? "Password Baru" : "Password *"} />
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <TextInput type="password" className="w-full pl-9 mt-1" value={data.password} onChange={e => setData('password', e.target.value)} />
                                        </div>
                                        <InputError message={errors.password} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="Ulangi Password" />
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <TextInput type="password" className="w-full pl-9 mt-1" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg">Batal</button>
                                <button type="submit" disabled={processing} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 hover:bg-indigo-700">
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