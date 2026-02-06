import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        // Konfigurasi agar bisa baca Code 128 (Barcode Barang) & QR
        const html5QrCode = new Html5Qrcode("reader");
        
        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 150 }, // Kotak scan persegi panjang (cocok buat barcode)
            aspectRatio: 1.0,
            formatsToSupport: [ 
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.QR_CODE 
            ]
        };

        // Mulai kamera (Environment = Kamera Belakang)
        html5QrCode.start(
            { facingMode: "environment" }, 
            config,
            (decodedText) => {
                // Saat berhasil scan
                html5QrCode.stop().then(() => {
                    onScanSuccess(decodedText);
                });
            },
            (errorMessage) => {
                // Ignore error saat scanning (karena akan spamming log kalau belum nemu barcode)
            }
        ).catch(err => {
            console.error("Gagal membuka kamera", err);
            alert("Gagal membuka kamera. Pastikan izin diberikan.");
            onClose();
        });

        scannerRef.current = html5QrCode;

        // Cleanup saat komponen ditutup
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.log(err));
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-4 right-4 z-10">
                <button onClick={onClose} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/40">
                    <X size={32} />
                </button>
            </div>
            
            <div className="text-white mb-4 font-bold text-center px-4">
                Arahkan kamera ke Barcode Barang / Rak
            </div>

            {/* Area Kamera */}
            <div id="reader" className="w-full max-w-sm bg-black border-2 border-indigo-500 rounded-lg overflow-hidden"></div>
            
            <p className="text-slate-400 text-xs mt-4 text-center px-8">
                Pastikan cahaya cukup dan barcode tidak terlipat.
            </p>
        </div>
    );
};

export default BarcodeScanner;