import React, { useState } from 'react';
import { Cloud, LockKeyhole, Mail, LogIn, LogOut, X } from 'lucide-react';
import { cloudEnabled, supabase } from '../services/cloud';

export function AccountModal({ open, onClose, user, onLogout }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  if (!open) return null;
  const submit = async event => {
    event.preventDefault();
    setBusy(true); setFeedback('');
    try {
      const { error, data } = creating
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (creating && !data.session) setFeedback('Účet byl vytvořen. Potvrďte svou e-mailovou adresu podle zprávy od Supabase a pak se přihlaste.');
      else onClose();
    } catch (err) { setFeedback(err.message || 'Přihlášení se nezdařilo.'); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[80] bg-stone-950/60 flex items-center justify-center p-4" role="presentation">
    <div role="dialog" aria-modal="true" aria-label="Účet knihovnice" className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
      <button onClick={onClose} aria-label="Zavřít" className="absolute right-5 top-5 p-2 rounded-xl hover:bg-stone-100"><X size={20}/></button>
      <div className="w-12 h-12 mb-4 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center"><Cloud size={24}/></div>
      <h2 className="font-bold text-2xl text-[#203b32]">Účet knihovnice</h2>
      <p className="text-sm text-stone-500 mt-2 mb-5">Po přihlášení se knihovní fond může bezpečně ukládat do vaší soukromé online databáze.</p>
      {!cloudEnabled ? <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">Online účty zatím nejsou nakonfigurovány. Správce aplikace musí nastavit Supabase podle návodu <code>CLOUD_SETUP.md</code>. Bez toho se knihy ukládají jen do tohoto prohlížeče.</div>
        : user ? <div className="space-y-4"><p className="bg-emerald-50 p-3 rounded-xl text-sm">Přihlášeno jako <strong>{user.email}</strong></p><button onClick={onLogout} className="w-full rounded-xl bg-stone-100 py-3 font-semibold flex items-center justify-center gap-2"><LogOut size={18}/> Odhlásit se</button></div>
        : <form className="space-y-3" onSubmit={submit}>
          <label className="block text-sm font-semibold">E-mail <span className="text-red-600">*</span><span className="relative block mt-1"><Mail size={18} className="absolute left-3 top-3.5 text-stone-400"/><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-stone-300 p-3 pl-10"/></span></label>
          <label className="block text-sm font-semibold">Heslo <span className="text-red-600">*</span><span className="relative block mt-1"><LockKeyhole size={18} className="absolute left-3 top-3.5 text-stone-400"/><input type="password" autoComplete={creating?'new-password':'current-password'} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-stone-300 p-3 pl-10"/></span></label>
          {feedback && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{feedback}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-[#245847] text-white py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><LogIn size={18}/>{busy?'Zpracovávám…':creating?'Založit účet':'Přihlásit se'}</button>
          <button type="button" className="w-full py-2 text-sm text-emerald-800 font-semibold" onClick={()=>{setCreating(v=>!v);setFeedback('');}}>{creating?'Už mám účet – přihlásit se':'Nemám účet – zaregistrovat se'}</button>
        </form>}
    </div>
  </div>;
}
