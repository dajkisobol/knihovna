import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

export function BarcodeScannerModal({ isOpen, onClose, onDetected }) {
  const scannerRef = useRef(null);
  const [scanError, setScanError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setScanError(null);

    const timer = setTimeout(() => {
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 160 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128
        ]
      };

      try {
        const scanner = new Html5QrcodeScanner('reader', config, /* verbose= */ false);
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.clear().catch(console.error);
            }
            onDetected(decodedText);
          },
          (errorMessage) => {
            // Ignore normal non-detection frames
          }
        );
      } catch (err) {
        console.error('Failed to initialize barcode scanner:', err);
        setScanError('Nepodařilo se spustit kameru. Ujistěte se, že máte povolen přístup ke kameře.');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => {
          console.warn('Error clearing html5QrcodeScanner:', err);
        });
        scannerRef.current = null;
      }
    };
  }, [isOpen, onDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-amber-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-amber-200/50 text-stone-500 hover:text-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-amber-200/80 text-amber-950 rounded-xl">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Naskenovat čárový kód (ISBN)</h3>
            <p className="text-xs text-stone-600">Namiřte kameru na EAN / ISBN čárový kód na zadní straně knihy</p>
          </div>
        </div>

        {scanError ? (
          <div className="p-4 bg-amber-100 border border-amber-300 rounded-xl text-amber-900 text-sm flex items-start space-x-2 my-4">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <span>{scanError}</span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-amber-300/80 bg-stone-900 my-3">
            <div id="reader" className="w-full text-white"></div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition cursor-pointer"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
