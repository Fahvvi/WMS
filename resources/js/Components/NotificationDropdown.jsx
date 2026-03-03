import { useState, useRef, useEffect } from 'react';
import { Bell, Check, BellRing } from 'lucide-react';
import { Link, usePage, router } from '@inertiajs/react';
import { useLaravelReactI18n } from 'laravel-react-i18n';

export default function NotificationDropdown() {
    const { t } = useLaravelReactI18n();
    const { auth } = usePage().props;
    const notifications = auth.unread_notifications || [];
    
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Tutup dropdown jika klik di luar area
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = (id, url = null) => {
        router.post(route('notifications.read', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (url) router.visit(url);
                setIsOpen(false);
            }
        });
    };

    const markAllAsRead = () => {
        router.post(route('notifications.read-all'), {}, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false)
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Tombol Lonceng */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
            >
                {notifications.length > 0 ? (
                    <>
                        <BellRing className="w-6 h-6 animate-pulse text-indigo-600 dark:text-indigo-400" />
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white dark:border-slate-900"></span>
                        </span>
                    </>
                ) : (
                    <Bell className="w-6 h-6" />
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('Notifikasi')}</h3>
                        {notifications.length > 0 && (
                            <button onClick={markAllAsRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                {t('Tandai semua dibaca')}
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group flex gap-3 items-start cursor-pointer" onClick={() => markAsRead(notif.id, notif.data.url)}>
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full shrink-0">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                            {notif.data.title}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                            {notif.data.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                            {new Date(notif.created_at).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} className="text-slate-300 hover:text-indigo-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title={t('Tandai dibaca')}>
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">{t('Belum ada notifikasi baru.')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}