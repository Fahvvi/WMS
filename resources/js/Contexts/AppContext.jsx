// resources/js/Contexts/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // --- 1. LOGIC DARK MODE ---
    const [darkMode, setDarkMode] = useState(() => {
        // Cek localStorage saat load pertama
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    // --- 2. LOGIC BAHASA (t) ---
    const [locale, setLocale] = useState(() => localStorage.getItem('locale') || 'id');

    const changeLanguage = (lang) => {
        setLocale(lang);
        localStorage.setItem('locale', lang);
    };

    // Kamus Kata (Dictionary) - Tambahkan kata-kata di sini
    const dictionaries = {
        id: {
            'Overview': 'Ringkasan',
            'Settings': 'Pengaturan',
            'Material Creation': 'Pembuatan Material',
            'Kategori Barang': 'Kategori Barang',
            'Gudang & Unit': 'Gudang & Unit',
            'Manajemen User': 'Manajemen Pengguna',
            'Role & Izin': 'Peran & Izin',
            'Log Aktivitas': 'Log Aktivitas',
            'Menu Pengaturan': 'Menu Pengaturan',
            'Data Gudang': 'Data Gudang',
            'Material & Produk': 'Material & Produk',
            'Role & Hak Akses': 'Role & Hak Akses',
            'Satuan Unit': 'Satuan Unit',
            'Halo': 'Halo',
            'Selamat datang di panel pengaturan.': 'Selamat datang di panel pengaturan.',
            'Silakan pilih menu di bawah ini untuk mengelola konfigurasi sistem WMS Anda.': 'Silakan pilih menu di bawah ini untuk mengelola konfigurasi sistem WMS Anda.',
            'Anda tidak memiliki akses ke menu pengaturan apa pun.': 'Anda tidak memiliki akses ke menu pengaturan apa pun.',
        },
        en: {
            // Default key is English, so we can leave empty or override specific terms
        }
    };

    const t = (key) => {
        if (locale === 'en') return key;
        return dictionaries[locale]?.[key] || key;
    };

    return (
        <AppContext.Provider value={{ darkMode, toggleDarkMode, locale, changeLanguage, t }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
