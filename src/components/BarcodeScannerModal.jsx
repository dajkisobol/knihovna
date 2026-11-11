import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle, Keyboard } from 'lucide-react';

function extractIsbn(value) {
  const text = String(value || '').trim();
  // QR codes can contain plain ISBN, an ISBN-labelled field, or a URL with isbn=...
  const candidates = [
    text.match(/(?:ISBN(?:-1[03])?\s*[:=\s]*)(97[89][\d\s-]{10,20}|[\d\s-]{9,16}[\dXx])/i)?.[1],
    text.match(/[?&]isbn(?:13|10)?=([^&#]+)/i)?.[1],
    text
  ].filter(Boolean);
  for (const candidate of candidates) {
    const raw = candidate.replace(/[^\dXx]/g, '').toUpperCase();
    if (/^\d{13}$/.test(raw) || /^\d{9}[\dX]$/.test(raw)) return raw;
    const embedded = candidate.match(/(?:97[89][\d-]{10,17}|\d[\d-]{8,16}[\dXx])/);
    if (embedded) {
      const compact = embedded[0].replace(/-/g, '').toUpperCase();
      if (/^\d{13}$/.test(compact) || /^\d{9}[\dX]$/.test(compact)) return compact;
    }
  }
  return '';
}

export function BarcodeScannerModal({ isOpen, onClose, onDetected, onManual }) {
  const scannerRef = useRef(null);
  const detectedRef = useRef(onDetected);
  const processed = useRef(false);
  const [scanError, setScanError] = useState('');
  useEffect(() => { detectedRef.current = onDetected; }, [onDetected]);

  useEffect(() => {
    if (!isOpen) { processed.current = false; return; }
    let cancelled = false;
    processed.current = false;
    // A new id per mounted scanner avoids clashing with previous teardown.
    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
          setScanError('Kamera vyžaduje zabezpečenou stránku HTTPS. Otevřete aplikaci přes HTTPS.');
          return;
        }
        const scanner = new Html5QrcodeScanner('isbn-reader', {
          fps: 10,
          qrbox: (viewWidth, viewHeight) => ({
            width: Math.min(280, Math.max(140, Math.floor(viewWidth * .75))),
            height: Math.min(180, Math.max(110, Math.floor(viewHeight * .55)))
          }),
          rememberLastUsedCamera: true,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ]
        }, false);
        scannerRef.current = scanner;
        scanner.render(text => {
          if (processed.current) return;
          const isbn = extractIsbn(text);
          if (!isbn) {
            setScanError('Kód byl přečten, ale neobsahuje ISBN-10 ani ISBN-13. Zkuste čárový kód knihy nebo ruční zadání.');
            return;
          }
          processed.current = true;
          setScanError('');
          detectedRef.current(isbn);
        }, () => {});
      } catch (err) {
        console.error('Scanner init error:', err);
        setScanError('Kameru se nepodařilo spustit. Zkontrolujte oprávnění fotoaparátu nebo zadejte ISBN ručně.');
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance) Promise.resolve(instance.clear()).catch(() => {});
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-4">
    <div className="bg-[#fbf9f5] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-emerald-200 relative">
      <button type="button" aria-label="Zavřít" onClick={onClose} className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-900"><X size={21}/></button>
      <div className="flex gap-3 items-center mb-4"><div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl"><Camera size={22}/></div>
        <div><h2 className="text-lg font-bold">Naskenovat QR nebo ISBN</h2><p className="text-xs text-stone-600">Povolte kameru a zamiřte na QR kód nebo čárový kód ISBN na knize.</p></div>
      </div>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden min-h-24"><div id="isbn-reader" className="w-full"/></div>
      {scanError && <div role="alert" className="mt-3 p-3 rounded-xl text-sm flex gap-2 bg-amber-50 border border-amber-200 text-amber-950"><AlertCircle className="shrink-0" size={18}/>{scanError}</div>}
      <p className="mt-3 text-xs text-stone-500">V prohlížeči je nutné povolit přístup ke kameře. QR kód musí obsahovat ISBN knihy.</p>
      <div className="flex justify-end flex-wrap gap-2 mt-5">
        <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 bg-stone-100">Zavřít</button>
        <button type="button" onClick={onManual} className="rounded-xl px-4 py-2 bg-emerald-800 text-white font-semibold inline-flex items-center gap-2"><Keyboard size={18}/> Zadat ISBN ručně</button>
      </div>
    </div>
  </div>;
}
