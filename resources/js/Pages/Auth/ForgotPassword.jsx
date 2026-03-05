import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, useForm, Link } from '@inertiajs/react';
import { Package, Mail, ArrowLeft, Send, Globe, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLaravelReactI18n } from 'laravel-react-i18n';

export default function ForgotPassword({ status }) {
    const { t, setLocale, currentLocale } = useLaravelReactI18n();

    // --- STATE UNTUK TEMA (GUEST) ---
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const activeLang = typeof currentLocale === 'function' ? currentLocale() : 'id';

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    // --- EFEK MENGUBAH TEMA SECARA VISUAL (GUEST) ---
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const handleLanguageChange = (e) => {
        const selectedLang = e.target.value;
        if(typeof setLocale === 'function') {
            setLocale(selectedLang);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative">
            <Head title={t('Lupa Password')} />

            {/* --- PANEL PENGATURAN KANAN ATAS (BAHASA & TEMA) --- */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50 flex items-center gap-3">
                <button 
                    onClick={toggleTheme}
                    type="button"
                    className="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title={theme === 'dark' ? 'Ganti ke Terang' : 'Ganti ke Gelap'}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition hover:shadow-md">
                    <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <select 
                        className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer py-1 pl-1 pr-6 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors appearance-none"
                        value={activeLang}
                        onChange={handleLanguageChange}
                    >
                        <option value="id" className="text-slate-900">🇮🇩 Indonesia</option>
                        <option value="en" className="text-slate-900">🇬🇧 English</option>
                        <option value="zh" className="text-slate-900">🇨🇳 中文</option>
                    </select>
                </div>
            </div>

            {/* --- BAGIAN KIRI: BRANDING (Desktop Only) --- */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden items-center justify-center">
                {/* Background Image Warehouse */}
                <div 
                    className="absolute inset-0 bg-cover bg-center z-0" 
                    style={{ backgroundImage: "url(/gudang.jpg)" }}
                ></div>
                
                {/* Overlay Gradient */}
                <div className={`absolute inset-0 z-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/95' : 'bg-gradient-to-br from-indigo-900/90 to-purple-900/80'}`}></div>

                {/* Content Branding */}
                <div className="relative z-20 text-white max-w-lg px-10">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                            <Package className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">WMSkd</h1>
                    </div>
                    <h2 className="text-4xl font-extrabold mb-4 leading-tight">
                        {t('Keamanan Akun')} <br/> {t('Tetap Terjaga.')}
                    </h2>
                    <p className="text-indigo-100 text-lg leading-relaxed opacity-90">
                        {t('Jangan khawatir jika Anda melupakan password. Sistem kami akan membantu Anda memulihkan akses dengan cepat dan aman.')}
                    </p>
                </div>

                {/* Dekorasi Circle */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            {/* --- BAGIAN KANAN: FORM FORGOT PASSWORD --- */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 relative">
                
                <div className="w-full max-w-md">
                    
                    {/* Tombol Kembali ke Login */}
                    <Link href={route('login')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> {t('Kembali ke Login')}
                    </Link>

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-start mb-6">
                        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('Lupa Password?')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            {t('Tidak masalah. Cukup beritahu kami alamat email Anda dan kami akan mengirimkan tautan untuk membuat password baru yang akan memungkinkan Anda memilih yang baru.')}
                        </p>
                    </div>

                    {status && <div className="mb-6 font-medium text-sm text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 p-3.5 rounded-xl border border-green-200 dark:border-green-800 shadow-sm flex items-start gap-2">
                        <div className="mt-0.5"><Mail className="w-4 h-4" /></div>
                        {status}
                    </div>}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="email" value={t('Alamat Email')} className="dark:text-slate-300" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="pl-10 block w-full py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm transition-all"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder={t('nama@perusahaan.com')}
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {processing ? t('Mengirim Tautan...') : t('Kirim Tautan Reset Password')}
                            {!processing && <Send className="w-5 h-5 ml-1" />}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-12 text-center text-sm text-slate-400 dark:text-slate-500">
                        &copy; {new Date().getFullYear()} WMS Pro System. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}