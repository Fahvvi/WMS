import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Search, Plus, User, Shield, Mail, Lock, Edit, Trash2, X, Save, 
    IdCard, CheckCircle2 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

// Terima props 'available_roles' dari Controller
export default function UserIndex({ users, filters, available_roles = [] }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        nip: '',
        email: '',
        role: '', // Kosongkan default
        password: '',
        password_confirmation: ''
    });

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get(route('settings.users.index'), { search: searchTerm }, { preserveState: true, replace: true });
        }
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingUser(null);
        reset();
        // Set default role ke role pertama yg tersedia jika ada
        setData('role', available_roles.length > 0 ? available_roles[0] : '');
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setIsEditMode(true);
        setEditingUser(user);
        
        // Ambil role dari Spatie (user.roles array) atau fallback ke user.role legacy
        const currentRole = user.roles && user.roles.length > 0 ? user.roles[0].name : user.role;

        setData({
            name: user.name,
            nip: user.nip || '',
            email: user.email,
            role: currentRole,
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
            confirmButtonText: 'Ya, Hapus!'
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

    // Helper untuk Badge Role
    const getRoleBadge = (user) => {
        // Prioritaskan Role Spatie
        const roleName = user.roles && user.roles.length > 0 ? user.roles[0].name : user.role;
        
        let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
        
        if (roleName?.toLowerCase().includes('admin')) colorClass = "bg-purple-100 text-purple-700 border-purple-200";
        else if (roleName?.toLowerCase().includes('spv') || roleName?.toLowerCase().includes('supervisor')) colorClass = "bg-blue-100 text-blue-700 border-blue-200";
        else if (roleName?.toLowerCase().includes('staff')) colorClass = "bg-green-100 text-green-700 border-green-200";

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase border ${colorClass}`}>
                {roleName || 'No Role'}
            </span>
        );
    };

    return (
        <SettingsLayout title="Manajemen User">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex-1 w-full sm:w-auto relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="Cari nama atau email..." 
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
                                <th className="px-6 py-3">Pegawai</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Jabatan (Role)</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold uppercase border border-indigo-200">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <IdCard className="w-3 h-3" /> {user.nip || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{user.email}</td>
                                        <td className="px-6 py-4">{getRoleBadge(user)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(user)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">Belum ada user.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
                        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                {isEditMode ? <Edit className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                                {isEditMode ? 'Edit Pegawai' : 'Tambah Pegawai'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-6">
                                {/* Grid Identitas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel value="Nama Lengkap *" />
                                        <TextInput className="w-full mt-1 border-slate-300 rounded-xl" value={data.name} onChange={e => setData('name', e.target.value)} required autoFocus />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value="NIP (Nomor Induk)" />
                                        <TextInput className="w-full mt-1 border-slate-300 rounded-xl font-mono" value={data.nip} onChange={e => setData('nip', e.target.value)} />
                                        <InputError message={errors.nip} className="mt-1" />
                                    </div>
                                </div>

                                {/* Email & Role (DYNAMIC ROLE DROPDOWN) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <InputLabel value="Email Login *" />
                                        <TextInput type="email" className="w-full mt-1 border-slate-300 rounded-xl" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <InputLabel value="Jabatan / Role *" />
                                        <div className="relative mt-1">
                                            <Shield className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                            <select 
                                                className="w-full pl-10 py-2.5 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl bg-white"
                                                value={data.role}
                                                onChange={e => setData('role', e.target.value)}
                                                required
                                            >
                                                <option value="" disabled>-- Pilih Role --</option>
                                                {available_roles.map((roleName, index) => (
                                                    <option key={index} value={roleName}>{roleName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Role menentukan hak akses pengguna di aplikasi.</p>
                                        <InputError message={errors.role} className="mt-1" />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                    {isEditMode && <p className="text-xs text-slate-500 mb-3 flex gap-1"><CheckCircle2 className="w-3 h-3" /> Kosongkan jika tidak ingin mengubah password.</p>}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel value="Password" />
                                            <TextInput type="password" className="w-full mt-1 rounded-xl" placeholder="******" value={data.password} onChange={e => setData('password', e.target.value)} />
                                            <InputError message={errors.password} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel value="Ulangi Password" />
                                            <TextInput type="password" className="w-full mt-1 rounded-xl" placeholder="******" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">Batal</button>
                                <button type="submit" disabled={processing} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2">
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