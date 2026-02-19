import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Search, Plus, User as UserIcon, Shield, Mail, Lock, Edit, Trash2, X, Save, 
    IdCard, CheckCircle2 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function UserIndex({ users, filters, available_roles = [] }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        nip: '',
        email: '',
        role: '', 
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
            title: t('Hapus User?'),
            text: t(`Akun "${user.name}" akan dihapus permanen.`),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: t('Ya, Hapus!'),
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('settings.users.destroy', user.id));
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

    // Helper untuk Badge Role dengan dukungan Dark Mode
    const getRoleBadge = (user) => {
        const roleName = user.roles && user.roles.length > 0 ? user.roles[0].name : user.role;
        
        let colorClass = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
        
        if (roleName?.toLowerCase().includes('admin')) {
            colorClass = "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50";
        } else if (roleName?.toLowerCase().includes('spv') || roleName?.toLowerCase().includes('supervisor')) {
            colorClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50";
        } else if (roleName?.toLowerCase().includes('staff')) {
            colorClass = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50";
        }

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase border ${colorClass}`}>
                {roleName || t('No Role')}
            </span>
        );
    };

    return (
        <SettingsLayout title={t('Manajemen User')}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors flex flex-col h-[calc(100vh-10rem)]">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex-1 w-full sm:w-auto relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            className="w-full h-10 pl-9 pr-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-slate-400" 
                            placeholder={t('Cari nama atau email...')} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            onKeyDown={handleSearch} 
                        />
                    </div>
                    <button 
                        onClick={openCreateModal} 
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition w-full sm:w-auto ml-auto"
                    >
                        <Plus className="w-4 h-4" /> {t('User Baru')}
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto relative">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20">
                            <tr>
                                <th className="px-6 py-4">{t('Pegawai')}</th>
                                <th className="px-6 py-4">{t('Email')}</th>
                                <th className="px-6 py-4">{t('Jabatan (Role)')}</th>
                                <th className="px-6 py-4 text-right">{t('Aksi')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold uppercase border border-indigo-200 dark:border-indigo-800/50">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <IdCard className="w-3 h-3" /> {user.nip || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.email}</td>
                                        <td className="px-6 py-4">{getRoleBadge(user)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition" title={t('Edit')}>
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(user)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title={t('Hapus')}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center text-slate-400 dark:text-slate-500">
                                        <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        {t('Belum ada user.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.links && users.data.length > 0 && (
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center transition-colors">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Total {users.total}</span>
                        <div className="flex gap-1">
                            {users.links.map((link, k) => (
                                link.url && (
                                    <Link 
                                        key={k} 
                                        href={link.url}
                                        className={`px-2 py-1 text-xs rounded border transition-colors ${link.active ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                {isEditMode ? <Edit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                                {isEditMode ? t('Edit Pegawai') : t('Tambah Pegawai')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-6">
                                
                                {/* Grid Identitas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel value={t('Nama Lengkap *')} className="dark:text-slate-300" />
                                        <TextInput 
                                            className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" 
                                            value={data.name} 
                                            onChange={e => setData('name', e.target.value)} 
                                            required 
                                            autoFocus 
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel value={t('NIP (Nomor Induk)')} className="dark:text-slate-300" />
                                        <TextInput 
                                            className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl font-mono" 
                                            value={data.nip} 
                                            onChange={e => setData('nip', e.target.value)} 
                                        />
                                        <InputError message={errors.nip} className="mt-1" />
                                    </div>
                                </div>

                                {/* Email & Role */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <InputLabel value={t('Email Login *')} className="dark:text-slate-300" />
                                        <div className="relative mt-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <TextInput 
                                                type="email" 
                                                className="w-full pl-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" 
                                                value={data.email} 
                                                onChange={e => setData('email', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <InputLabel value={t('Jabatan / Role *')} className="dark:text-slate-300" />
                                        <div className="relative mt-1">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <select 
                                                className="w-full pl-9 h-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl shadow-sm transition-colors"
                                                value={data.role}
                                                onChange={e => setData('role', e.target.value)}
                                                required
                                            >
                                                <option value="" disabled>-- {t('Pilih Role')} --</option>
                                                {available_roles.map((roleName, index) => (
                                                    <option key={index} value={roleName}>{roleName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{t('Role menentukan hak akses pengguna di aplikasi.')}</p>
                                        <InputError message={errors.role} className="mt-1" />
                                    </div>
                                </div>

                                {/* Password Section */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                                    {isEditMode && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 p-2 rounded-lg border border-yellow-100 dark:border-yellow-800/50">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> {t('Kosongkan jika tidak ingin mengubah password.')}
                                        </p>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <InputLabel value={t('Password')} className="dark:text-slate-300" />
                                            <div className="relative mt-1">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <TextInput 
                                                    type="password" 
                                                    className="w-full pl-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                                                    placeholder="******" 
                                                    value={data.password} 
                                                    onChange={e => setData('password', e.target.value)} 
                                                />
                                            </div>
                                            <InputError message={errors.password} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel value={t('Ulangi Password')} className="dark:text-slate-300" />
                                            <div className="relative mt-1">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <TextInput 
                                                    type="password" 
                                                    className="w-full pl-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                                                    placeholder="******" 
                                                    value={data.password_confirmation} 
                                                    onChange={e => setData('password_confirmation', e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-2xl">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">
                                    {t('Batal')}
                                </button>
                                <button type="submit" disabled={processing} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50">
                                    <Save className="w-4 h-4" /> {processing ? t('Menyimpan...') : t('Simpan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}