import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { Package, Mail, Lock, ArrowRight, Warehouse } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            <Head title="Log in" />

            {/* --- BAGIAN KIRI: BRANDING (Desktop Only) --- */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden items-center justify-center">
                {/* Background Image Warehouse */}
                <div 
                    className="absolute inset-0 bg-cover bg-center z-0" 
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" }}
                ></div>
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/80 z-10"></div>

                {/* Content Branding */}
                <div className="relative z-20 text-white max-w-lg px-10">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                            <Package className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">WMS Pro</h1>
                    </div>
                    <h2 className="text-4xl font-extrabold mb-4 leading-tight">
                        Kelola Gudang <br/> Lebih Cerdas.
                    </h2>
                    <p className="text-indigo-100 text-lg leading-relaxed opacity-90">
                        Sistem manajemen pergudangan terintegrasi untuk Inbound, Outbound, dan kontrol stok yang akurat secara Real-time.
                    </p>
                    
                    {/* Stats Mockup */}
                    <div className="mt-12 flex gap-8">
                        <div>
                            <p className="text-3xl font-bold">99.9%</p>
                            <p className="text-sm text-indigo-200 uppercase tracking-wide">Akurasi Stok</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">24/7</p>
                            <p className="text-sm text-indigo-200 uppercase tracking-wide">Monitoring</p>
                        </div>
                    </div>
                </div>

                {/* Dekorasi Circle */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            {/* --- BAGIAN KANAN: FORM LOGIN --- */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 relative">
                
                <div className="w-full max-w-md">
                    {/* Mobile Logo (Hanya muncul di HP) */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900">Selamat Datang!</h2>
                        <p className="text-slate-500 mt-2">Silakan login untuk mengakses dashboard.</p>
                    </div>

                    {status && <div className="mb-4 font-medium text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">{status}</div>}

                    <form onSubmit={submit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <InputLabel htmlFor="email" value="Email Perusahaan" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="pl-10 block w-full py-3 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm transition-all"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@perusahaan.com"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password Input */}
                        <div>
                            <InputLabel htmlFor="password" value="Password" />
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="pl-10 block w-full py-3 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm transition-all"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-slate-600">Ingat Saya</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition"
                                >
                                    Lupa password?
                                </Link>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Memproses...' : 'Masuk ke Dashboard'}
                            {!processing && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-slate-400">
                        &copy; {new Date().getFullYear()} WMS Pro System. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}