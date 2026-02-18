import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { useLaravelReactI18n } from 'laravel-react-i18n'; // <--- IMPORT I18N

export default function UpdatePreferencesForm({ className = '' }) {
    const user = usePage().props.auth.user;
    const { t } = useLaravelReactI18n(); // <--- INISIALISASI I18N

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,  
        email: user.email,
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
                    localStorage.setItem('theme', 'dark'); // Simpan juga di localStorage
                } else if (data.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                } else {
                    // Logika 'system' (mengikuti preferensi OS)
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    localStorage.removeItem('theme');
                }

                // Reload halaman agar perubahan locale (bahasa) teraplikasikan ke seluruh komponen
                window.location.reload();
            }
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    {t('Preferensi Tampilan & Bahasa')}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t('Sesuaikan tema aplikasi dan bahasa sistem sesuai dengan kenyamanan Anda.')}
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="theme" value={t('Tema Aplikasi')} className="dark:text-slate-300" />
                    <select
                        id="theme"
                        value={data.theme}
                        onChange={(e) => setData('theme', e.target.value)}
                        className="mt-1 block w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm transition-colors"
                    >
                        <option value="light">{t('Terang (Light)')}</option>
                        <option value="dark">{t('Gelap (Dark)')}</option>
                        <option value="system">{t('Mengikuti Sistem (OS)')}</option>
                    </select>
                    <InputError className="mt-2" message={errors.theme} />
                </div>

                <div>
                    <InputLabel htmlFor="locale" value={t('Bahasa (Language)')} className="dark:text-slate-300" />
                    <select
                        id="locale"
                        value={data.locale}
                        onChange={(e) => setData('locale', e.target.value)}
                        className="mt-1 block w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm transition-colors"
                    >
                        <option value="id">{t('Indonesia')}</option>
                        <option value="en">{t('English')}</option>
                        <option value="zh">{t('中文 (Chinese)')}</option>
                    </select>
                    <InputError className="mt-2" message={errors.locale} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        {t('Simpan Perubahan')}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('Tersimpan.')}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}