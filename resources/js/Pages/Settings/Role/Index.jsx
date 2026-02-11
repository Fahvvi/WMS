import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Shield, Plus, Edit, Trash2, X, Save, CheckCircle2, Lock 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

export default function RoleIndex({ roles, groupedPermissions }) {
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
            Swal.fire('Akses Ditolak', 'Role Super Admin dilindungi sistem.', 'warning');
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
            title: 'Hapus Role?',
            text: `Role "${role.name}" akan dihapus. User terkait akan kehilangan akses.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus!'
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

    // Helper formatter nama permission agar cantik di UI
    const formatPermissionName = (name, groupName) => {
        // Hapus nama grup dari permission biar tidak redundant (e.g. "view_products" -> "view")
        // Dan ganti underscore dengan spasi
        let cleanName = name.replace(/_/g, ' ');
        const groupLower = groupName.toLowerCase();
        
        if (cleanName.includes(groupLower)) {
            cleanName = cleanName.replace(groupLower, '').trim();
        }
        
        // Jika hasil kosong atau cuma spasi (kasus namanya sama persis grup), kembalikan nama asli
        return cleanName || name.replace(/_/g, ' ');
    };

    return (
        <SettingsLayout title="Manajemen Role & Akses">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Daftar Role (Jabatan)</h2>
                        <p className="text-sm text-slate-500">Atur hak akses aplikasi berdasarkan jabatan.</p>
                    </div>
                    <button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition">
                        <Plus className="w-4 h-4" /> Tambah Role
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-1/4">Nama Role</th>
                                <th className="px-6 py-3">Hak Akses (Permissions)</th>
                                <th className="px-6 py-3 text-right w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {roles.map((role) => (
                                <tr key={role.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 font-bold text-slate-800">
                                        {role.name}
                                        {role.name === 'Super Admin' && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">SYSTEM</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.length > 0 ? (
                                                role.permissions.slice(0, 5).map(p => (
                                                    <span key={p.id} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 capitalize">
                                                        {p.name.replace(/_/g, ' ')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Tidak ada izin khusus</span>
                                            )}
                                            {role.permissions.length > 5 && (
                                                <span className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-400 rounded">+{role.permissions.length - 5} lainnya...</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {role.name !== 'Super Admin' ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(role)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(role)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end p-2"><Lock className="w-4 h-4 text-slate-300" /></div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-600" />
                                {isEditMode ? `Edit Role: ${editingRole.name}` : 'Buat Role Baru'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 transition"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="roleForm" onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel value="Nama Jabatan / Role" />
                                    <TextInput 
                                        className="w-full mt-1 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg" 
                                        placeholder="Contoh: Auditor, Kepala Gudang"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        autoFocus
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                <hr className="border-slate-100" />

                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-4">Atur Hak Akses (Permissions)</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.keys(groupedPermissions).map((groupName) => (
                                            <div key={groupName} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition">
                                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                                    <span className="font-bold text-xs text-slate-700 uppercase tracking-wide">{groupName}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => toggleGroup(groupName, groupedPermissions[groupName])}
                                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                                    >
                                                        Pilih Semua
                                                    </button>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {groupedPermissions[groupName].map((perm) => (
                                                        <label key={perm.id} className="flex items-center gap-3 cursor-pointer group hover:bg-white p-1 rounded transition">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500 cursor-pointer"
                                                                checked={data.permissions.includes(perm.name)}
                                                                onChange={() => togglePermission(perm.name)}
                                                            />
                                                            {/* LOGIC LABEL BARU: Hapus prefix group dari nama permission */}
                                                            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition capitalize select-none">
                                                                {perm.name.replace(groupName.toLowerCase() + '_', '').replace(/_/g, ' ')}
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

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-xl transition">Batal</button>
                            <button type="submit" form="roleForm" disabled={processing} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition">
                                <Save className="w-4 h-4" /> Simpan Role
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}