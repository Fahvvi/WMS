import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Shield, Plus, Edit, Trash2, X, Save, Lock 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function RoleIndex({ roles, groupedPermissions }) {
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        permissions: [] 
    });

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingRole(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (role) => {
        if(role.name === 'Super Admin') {
            Swal.fire(t('Akses Ditolak'), t('Role Super Admin dilindungi sistem.'), 'warning');
            return;
        }
        setIsEditMode(true);
        setEditingRole(role);
        setData({
            name: role.name,
            permissions: role.permissions.map(p => p.name) 
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('settings.roles.update', editingRole.id), { onSuccess: () => setIsModalOpen(false) });
        } else {
            post(route('settings.roles.store'), { onSuccess: () => setIsModalOpen(false) });
        }
    };

    const handleDelete = (role) => {
        if(role.name === 'Super Admin') return;
        
        Swal.fire({
            title: t('Hapus Role?'),
            text: t(`Role "${role.name}" akan dihapus. User terkait akan kehilangan akses.`),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: t('Ya, Hapus!'),
            cancelButtonText: t('Batal')
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('settings.roles.destroy', role.id));
            }
        });
    };

    const togglePermission = (permName) => {
        const currentPerms = [...data.permissions];
        if (currentPerms.includes(permName)) {
            setData('permissions', currentPerms.filter(p => p !== permName));
        } else {
            setData('permissions', [...currentPerms, permName]);
        }
    };

    const toggleGroup = (groupName, permsInGroup) => {
        const allNames = permsInGroup.map(p => p.name);
        const currentPerms = [...data.permissions];
        const isAllSelected = allNames.every(name => currentPerms.includes(name));

        if (isAllSelected) {
            setData('permissions', currentPerms.filter(name => !allNames.includes(name)));
        } else {
            const newPerms = [...new Set([...currentPerms, ...allNames])];
            setData('permissions', newPerms);
        }
    };

    return (
        <SettingsLayout title={t('Manajemen Role & Akses')}>
            <Head title={t('Manajemen Role')} />

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors flex flex-col h-[calc(100vh-10rem)]">
                
                {/* Toolbar Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('Daftar Role (Jabatan)')}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('Atur hak akses aplikasi berdasarkan jabatan.')}</p>
                    </div>
                    <button 
                        onClick={openCreateModal} 
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition"
                    >
                        <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t('Tambah Role')}</span>
                    </button>
                </div>

                {/* Table Wrapper */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 w-1/4">{t('Nama Role')}</th>
                                <th className="px-6 py-4">{t('Hak Akses (Permissions)')}</th>
                                <th className="px-6 py-4 text-right w-24">{t('Aksi')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {roles.map((role) => (
                                <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                                        <div className="flex items-center flex-wrap gap-2">
                                            {role.name}
                                            {role.name === 'Super Admin' && (
                                                <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/50">
                                                    SYSTEM
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.length > 0 ? (
                                                role.permissions.slice(0, 5).map(p => (
                                                    <span key={p.id} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 capitalize">
                                                        {p.name.replace(/_/g, ' ')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 dark:text-slate-500 italic">{t('Tidak ada izin khusus')}</span>
                                            )}
                                            {role.permissions.length > 5 && (
                                                <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 rounded">
                                                    +{role.permissions.length - 5} {t('lainnya...')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {role.name !== 'Super Admin' ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(role)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition" title={t('Edit')}>
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(role)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title={t('Hapus')}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end p-2" title={t('Dilindungi Sistem')}>
                                                <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-colors">
                        
                        {/* Header Modal */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                {isEditMode ? `${t('Edit Role')}: ${editingRole.name}` : t('Buat Role Baru')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Body Modal (Scrollable) */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="roleForm" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel value={t('Nama Jabatan / Role')} className="dark:text-slate-300" />
                                    <TextInput 
                                        className="w-full mt-1 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl" 
                                        placeholder={t('Contoh: Auditor, Kepala Gudang')}
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        autoFocus
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                <hr className="border-slate-100 dark:border-slate-700" />

                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">{t('Atur Hak Akses (Permissions)')}</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.keys(groupedPermissions).map((groupName) => (
                                            <div key={groupName} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition">
                                                <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                                        {t(groupName)}
                                                    </span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => toggleGroup(groupName, groupedPermissions[groupName])}
                                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline focus:outline-none"
                                                    >
                                                        {t('Pilih Semua')}
                                                    </button>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {groupedPermissions[groupName].map((perm) => (
                                                        <label key={perm.id} className="flex items-center gap-3 cursor-pointer group hover:bg-white dark:hover:bg-slate-800 p-1.5 rounded-lg transition">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-indigo-600 shadow-sm focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
                                                                checked={data.permissions.includes(perm.name)}
                                                                onChange={() => togglePermission(perm.name)}
                                                            />
                                                            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition capitalize select-none">
                                                                {t(perm.name.replace(groupName.toLowerCase() + '_', '').replace(/_/g, ' '))}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer Modal */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition">
                                {t('Batal')}
                            </button>
                            <button type="submit" form="roleForm" disabled={processing} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition disabled:opacity-50">
                                <Save className="w-4 h-4" /> {processing ? t('Menyimpan...') : t('Simpan Role')}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}