import SettingsLayout from '@/Layouts/SettingsLayout';
import { useForm, router } from '@inertiajs/react';
import { Trash2, Plus, Tag } from 'lucide-react';
import TextInput from '@/Components/TextInput';

export default function AttributeIndex({ categories, units }) {
    
    // Form Category
    const { data: dataCat, setData: setDataCat, post: postCat, reset: resetCat, processing: procCat } = useForm({ name: '' });
    
    // Form Unit
    const { data: dataUnit, setData: setDataUnit, post: postUnit, reset: resetUnit, processing: procUnit } = useForm({ name: '', description: '' });

    const submitCategory = (e) => {
        e.preventDefault();
        postCat(route('settings.categories.store'), { onSuccess: () => resetCat() });
    };

    const submitUnit = (e) => {
        e.preventDefault();
        postUnit(route('settings.units.store'), { onSuccess: () => resetUnit() });
    };

    const deleteItem = (url) => {
        if(confirm('Hapus data ini?')) router.delete(url);
    };

    return (
        <SettingsLayout title="Unit & Kategori">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* --- KOLOM KATEGORI --- */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-indigo-600" /> Kategori Produk
                    </h3>
                    
                    <form onSubmit={submitCategory} className="flex gap-2 mb-6">
                        <TextInput 
                            className="w-full text-sm" 
                            placeholder="Nama Kategori (ex: Elektronik)" 
                            value={dataCat.name}
                            onChange={e => setDataCat('name', e.target.value)}
                        />
                        <button disabled={procCat} className="bg-indigo-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-indigo-700">
                            <Plus size={18} />
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-indigo-200 transition">
                                <span className="font-medium text-slate-700">{cat.name}</span>
                                <button onClick={() => deleteItem(route('settings.categories.destroy', cat.id))} className="text-slate-300 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {categories.length === 0 && <p className="text-slate-400 text-sm text-center italic">Belum ada kategori.</p>}
                    </div>
                </div>

                {/* --- KOLOM UNIT --- */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-orange-600" /> Satuan Unit
                    </h3>

                    <form onSubmit={submitUnit} className="flex gap-2 mb-6">
                        <TextInput 
                            className="w-full text-sm" 
                            placeholder="Nama Unit (ex: Pcs, Box)" 
                            value={dataUnit.name}
                            onChange={e => setDataUnit('name', e.target.value)}
                        />
                        <button disabled={procUnit} className="bg-orange-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-orange-700">
                            <Plus size={18} />
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {units.map(unit => (
                            <div key={unit.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-orange-200 transition">
                                <span className="font-medium text-slate-700">{unit.name}</span>
                                <button onClick={() => deleteItem(route('settings.units.destroy', unit.id))} className="text-slate-300 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                         {units.length === 0 && <p className="text-slate-400 text-sm text-center italic">Belum ada unit.</p>}
                    </div>
                </div>

            </div>
        </SettingsLayout>
    );
}