import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

export default function UpdatePreferencesForm({ className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        theme: user.theme || 'light',
        locale: user.locale || 'id',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                // Terapkan perubahan tema langsung tanpa perlu reload penuh
                if (data.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (data.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                } else {
                    // Logika 'system' (mengikuti preferensi OS)
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            }
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Preferensi Tampilan & Bahasa</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Sesuaikan tema aplikasi dan bahasa sistem sesuai dengan kenyamanan Anda.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="theme" value="Tema Aplikasi" />
                    <select
                        id="theme"
                        value={data.theme}
                        onChange={(e) => setData('theme', e.target.value)}
                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                    >
                        <option value="light">Terang (Light)</option>
                        <option value="dark">Gelap (Dark)</option>
                        <option value="system">Mengikuti Sistem (OS)</option>
                    </select>
                    <InputError className="mt-2" message={errors.theme} />
                </div>

                <div>
                    <InputLabel htmlFor="locale" value="Bahasa (Language)" />
                    <select
                        id="locale"
                        value={data.locale}
                        onChange={(e) => setData('locale', e.target.value)}
                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                    >
                        <option value="id">Indonesia</option>
                        <option value="en">English</option>
                        <option value="zh">中文 (Chinese)</option>
                    </select>
                    <InputError className="mt-2" message={errors.locale} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Simpan Perubahan</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tersimpan.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}