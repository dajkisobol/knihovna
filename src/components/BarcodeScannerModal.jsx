import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle, Keyboard } from 'lucide-react';

export function extractIsbn(value) {
  let text = String(value || '').trim();
  try { text = decodeURIComponent(text); } catch { /* malformed URL */ }
  const candidates = text.match(/(?<!\d)97[89](?:[\s-]*\d){10}(?![\s-]*\d)|(?<!\d)\d(?:[\s-]*\d){8}[\s-]*[\dXx](?![\s-]*\d)/g) || [];
  for (const candidate of candidates) {
    const isbn = candidate.replace(/[\s-]/g, '').toUpperCase();
    if (/^97[89]\d{10}$/.test(isbn) && [...isbn].reduce((s,d,i)=>s+Number(d)*(i%2?3:1),0)%10===0) return isbn;
    if (/^\d{9}[\dX]$/.test(isbn) && [...isbn].reduce((s,d,i)=>s+(d==='X'?10:Number(d))*(10-i),0)%11===0) return isbn;
  }
  return '';
}

// Serialize camera startup and teardown across rapid close/reopen and StrictMode.
let cameraQueue = Promise.resolve();
let readerSequence = 0;
const enqueue = task => {
  const next = cameraQueue.then(task, task);
  cameraQueue = next.catch(()=>{});
  return next;
};
const errorText = error => {
  const reason = [error?.name, error?.message, String(error || '')].filter(Boolean).join(': ');
  if (/NotAllowed|Permission|denied/i.test(reason)) return 'Povolte přístup ke kameře v nastavení prohlížeče a zkuste to znovu.';
  if (/NotFound|DevicesNotFound/i.test(reason)) return 'Nebyla nalezena kamera. Zkuste načíst fotografii.';
  if (/NotReadable|TrackStart/i.test(reason)) return 'Kameru možná používá jiná aplikace. Zavřete ji a zkuste znovu.';
  return 'Kameru se nepodařilo spustit. Detail: ' + reason;
};

export function BarcodeScannerModal({ isOpen, onClose, onDetected, onManual }) {
  const reader = useRef(null);
  const detected = useRef(onDetected);
  const [attempt, setAttempt] = useState(0);
  const [facing, setFacing] = useState('environment');
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  useEffect(()=>{ detected.current=onDetected; },[onDetected]);
  useEffect(()=>{
    if (!isOpen) return;
    const current = { cancelled:false, done:false, scanner:null, running:false };
    setStatus('starting'); setError('');
    const node=reader.current;
    const host=document.createElement('div');
    host.id='isbn-reader-'+(++readerSequence);
    node.appendChild(host);
    const accept = value => {
      if(current.cancelled || current.done) return;
      const isbn=extractIsbn(value);
      if(!isbn){setError('Tento kód neobsahuje platné ISBN. Zamiřte na čárový kód knihy.');return;}
      current.done=true;
      setError(''); setStatus('found');
      try { navigator.vibrate?.(80); } catch { /* optional */ }
      detected.current(isbn);
    };
    enqueue(async()=>{
      if(current.cancelled) return;
      try {
        current.scanner=new Html5Qrcode(host.id,{formatsToSupport:[
          Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128
        ],verbose:false});
        if(file){
          setStatus('photo');
          const result=await current.scanner.scanFile(file,true);
          accept(result);
          if(!current.done && !current.cancelled) setStatus('error');
          return;
        }
        if(!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
        const config={fps:12, disableFlip:false};
        try {
          await current.scanner.start({facingMode:facing},config,accept,()=>{});
        } catch (err) {
          if(current.cancelled || /NotAllowed|Permission|denied|NotReadable/i.test(String(err))) throw err;
          const cameras = await Html5Qrcode.getCameras();
          if(current.cancelled) return;
          if(!cameras.length) throw new Error('NotFoundError: žádná kamera');
          const preferred = cameras.find(c=>facing==='environment'?/back|rear|zadní|environment/i.test(c.label):/front|face|přední|user/i.test(c.label));
          await current.scanner.start((preferred || cameras[0]).id,config,accept,()=>{});
        }
        current.running=true;
        if(!current.cancelled && !current.done) setStatus('ready');
      } catch(err){
        if(!current.cancelled && !current.done){setStatus('error');setError(file?'Na fotografii se nepodařilo najít ISBN. Zkuste ostřejší snímek.':errorText(err));}
      }
    });
    return ()=>{
      current.cancelled=true;
      enqueue(async()=>{
        try { if(current.running) await current.scanner.stop(); } catch { /* already stopped */ }
        try { current.scanner?.clear(); } catch { /* already cleared */ }
        host.remove();
      });
    };
  },[isOpen,attempt,facing,file]);
  useEffect(()=>{if(!isOpen){setFile(null);setFacing('environment');}},[isOpen]);

  if(!isOpen) return null;
  const restart=()=>{setFile(null);setAttempt(n=>n+1);};
  return <div className="fixed inset-0 z-50 bg-stone-900/60 flex items-center justify-center p-3 overflow-y-auto">
    <div role="dialog" aria-modal="true" aria-label="Skenování ISBN" className="bg-[#fbf9f5] rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-emerald-200 relative max-h-[95dvh] overflow-y-auto">
      <button type="button" aria-label="Zavřít" onClick={onClose} className="absolute top-3 right-3 p-2 text-stone-500"><X size={21}/></button>
      <div className="flex gap-3 items-center mb-4 pr-8"><div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl"><Camera size={22}/></div><div><h2 className="text-lg font-bold">Naskenovat knihu</h2><p className="text-xs text-stone-600">ISBN, čárový kód nebo QR s ISBN</p></div></div>
      <div className="relative bg-stone-900 rounded-xl overflow-hidden min-h-32"><div ref={reader} className="w-full [&_video]:max-h-[45dvh] [&_video]:object-contain"/>{status==='ready' && <div aria-hidden="true" className="absolute pointer-events-none inset-[15%] border-2 border-emerald-300 rounded-xl flex items-center"><div className="w-full border-t border-emerald-300/70"/></div>}</div>
      <p role="status" className="mt-3 text-sm text-stone-600">{({starting:'Spouštím kameru… Povolte přístup, pokud se prohlížeč zeptá.',ready:'Držte celý kód v záběru, bez odlesků. Pomalu měňte vzdálenost.',photo:'Čtu fotografii…',found:'ISBN načteno, hledám knihu…',error:'Skenování se nezdařilo.'})[status]}</p>
      {error && <div role="alert" className="mt-3 p-3 rounded-xl text-sm flex gap-2 bg-amber-50 border border-amber-200 text-amber-950"><AlertCircle className="shrink-0" size={18}/>{error}</div>}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button type="button" onClick={restart} className="rounded-xl px-3 py-2 bg-stone-100">Zkusit znovu</button>
        <button type="button" onClick={()=>{setFile(null);setFacing(v=>v==='environment'?'user':'environment');}} className="rounded-xl px-3 py-2 bg-stone-100">Přepnout kameru</button>
        <label className="rounded-xl px-3 py-2 bg-stone-100 text-center cursor-pointer">Načíst fotografii<input type="file" accept="image/*" className="sr-only" onChange={e=>{const selected=e.target.files?.[0];if(selected){setFile(selected);setAttempt(n=>n+1);}e.target.value='';}}/></label>
        <button type="button" onClick={onManual} className="rounded-xl px-3 py-2 bg-emerald-800 text-white font-semibold flex items-center justify-center gap-2"><Keyboard size={18}/> ISBN ručně</button>
      </div>
    </div>
  </div>;
}
