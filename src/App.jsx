import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ScanLine, Search, Plus, Download, Upload, CheckCircle2, Clock3, MapPin, Pencil, Trash2, X, LibraryBig, AlertTriangle } from 'lucide-react';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ManualIsbnModal } from './components/ManualIsbnModal';
import { fetchBookByIsbn } from './services/bookService';

const KEY = 'knihovna_books_v1';
const SECTION_KEY = 'knihovna_sections_v1';
const DEFAULT_SECTIONS = ['Beletrie', 'Dětské knihy', 'Naučná literatura', 'Poezie', 'Ostatní'];
const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const normalize = (book) => ({
  ...book,
  id: book.id || createId(),
  title: book.title || 'Bez názvu',
  authors: book.authors || book.author || '',
  isbn: String(book.isbn || ''),
  section: book.section || 'Ostatní',
  shelf: book.shelf || '',
  status: book.status === 'borrowed' ? 'borrowed' : 'available',
  note: book.note || '',
  addedAt: book.addedAt || new Date().toISOString(),
});
const emptyBook = () => normalize({ id: createId(), title: '', authors: '', isbn: '', section: 'Beletrie', shelf: '', status: 'available', coverUrl: '' });

function loadBooks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(normalize) : [];
  } catch { return []; }
}
function loadSections() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SECTION_KEY) || 'null');
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_SECTIONS;
  } catch { return DEFAULT_SECTIONS; }
}
function csvCell(value) { return '"' + String(value ?? '').replace(/"/g, '""') + '"'; }
function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [books, setBooks] = useState(loadBooks);
  const [sections, setSections] = useState(loadSections);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [scanOpen, setScanOpen] = useState(false);
  const [isbnOpen, setIsbnOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lookup, setLookup] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [newSection, setNewSection] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(books)); } catch { setMessage('Úložiště prohlížeče je plné nebo nedostupné. Exportujte zálohu.'); } }, [books]);
  useEffect(() => { localStorage.setItem(SECTION_KEY, JSON.stringify(sections)); }, [sections]);

  const filtered = useMemo(() => books.filter(b => {
    const text = [b.title, b.authors, b.isbn, b.section, b.shelf, b.note].join(' ').toLocaleLowerCase('cs');
    return text.includes(query.toLocaleLowerCase('cs')) &&
      (statusFilter === 'all' || b.status === statusFilter) &&
      (sectionFilter === 'all' || b.section === sectionFilter);
  }).sort((a,b) => a.title.localeCompare(b.title, 'cs')), [books, query, statusFilter, sectionFilter]);

  const borrowed = books.filter(b => b.status === 'borrowed').length;

  const upsert = book => {
    const finalBook = normalize(book);
    if (!finalBook.title.trim()) { setMessage('Vyplňte název knihy.'); return; }
    setBooks(prev => prev.some(b => b.id === finalBook.id) ? prev.map(b => b.id === finalBook.id ? finalBook : b) : [finalBook, ...prev]);
    setEditing(null); setMessage('Kniha byla uložena.');
  };

  const processIsbn = async isbn => {
    setScanOpen(false); setIsbnOpen(false); setLoading(true); setMessage('');
    try {
      const result = await fetchBookByIsbn(String(isbn).trim());
      // Every physical copy gets its own ID, even if ISBN is identical.
      setEditing(normalize({ ...result, id: createId(), section: 'Beletrie', shelf: '', status: 'available', note: '' }));
    } catch {
      setEditing(normalize({ ...emptyBook(), isbn: String(isbn).trim() }));
      setMessage('Metadata nebyla nalezena. Údaje můžete doplnit ručně.');
    } finally { setLoading(false); }
  };

  const searchTitles = async event => {
    event.preventDefault();
    if (!lookup.trim()) return;
    setLoading(true); setLookupResults([]); setMessage('');
    try {
      const response = await fetch('https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent('intitle:' + lookup.trim()) + '&maxResults=12');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setLookupResults((data.items || []).map(item => {
        const info = item.volumeInfo || {};
        return {
          id: item.id,
          title: info.title || 'Bez názvu',
          authors: (info.authors || []).join(', '),
          isbn: (info.industryIdentifiers || []).find(v => v.type === 'ISBN_13')?.identifier || (info.industryIdentifiers || [])[0]?.identifier || '',
          coverUrl: (info.imageLinks?.thumbnail || '').replace(/^http:/, 'https:'),
          publisher: info.publisher || '',
          publishedDate: info.publishedDate || '',
          description: info.description || '',
        };
      }));
      if (!(data.items || []).length) setMessage('Žádné výsledky. Knihu můžete založit ručně.');
    } catch { setMessage('Vyhledávání se nezdařilo. Zadejte knihu ručně.'); }
    finally { setLoading(false); }
  };

  const exportJson = () => download('knihovna-zaloha.json', JSON.stringify({ version: 1, books, sections, exportedAt: new Date().toISOString() }, null, 2), 'application/json');
  const exportCsv = () => {
    const cols = ['title','authors','isbn','section','shelf','status','note'];
    download('knihovna-katalog.csv', '\uFEFF' + [cols.join(';'), ...books.map(b => cols.map(k => csvCell(b[k])).join(';'))].join('\r\n'), 'text/csv;charset=utf-8');
  };
  const importJson = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.books)) throw new Error();
      if (!window.confirm('Import nahradí aktuální katalog (' + books.length + ' knih). Pokračovat?')) return;
      setBooks(data.books.filter(Boolean).map(normalize));
      if (Array.isArray(data.sections) && data.sections.length) setSections(data.sections);
      setMessage('Záloha byla načtena.');
    } catch { setMessage('Soubor není platná JSON záloha knihovny.'); }
    finally { event.target.value = ''; }
  };

  const inputStyle = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700';
  const buttonStyle = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition hover:opacity-90';
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-stone-800">
      <header className="bg-[#164f46] text-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-7 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center"><LibraryBig size={32}/><div><h1 className="text-2xl font-bold tracking-tight">Knihovní katalog</h1><p className="text-sm text-emerald-100">Jednoduchá evidence knih a výpůjček</p></div></div>
          <div className="flex gap-2 flex-wrap">
            <button className={buttonStyle + ' bg-white/15 text-white'} onClick={() => setShowSettings(v => !v)}>Sekce a zálohy</button>
            <button className={buttonStyle + ' bg-emerald-100 text-emerald-950'} onClick={() => setScanOpen(true)}><ScanLine size={19}/> Skenovat ISBN</button>
            <button className={buttonStyle + ' bg-white text-emerald-900'} onClick={() => setEditing(emptyBook())}><Plus size={19}/> Přidat knihu</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-7 space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 flex items-start gap-2"><AlertTriangle size={19} className="shrink-0 mt-0.5"/><span><b>Lokální evidence:</b> knihy se zatím ukládají jen v tomto prohlížeči a nesynchronizují se mezi počítači. Pro jistotu pravidelně stahujte JSON zálohu. Pro skutečný sdílený provoz knihovny je nutná online databáze a přihlášení.</span></div>
        {message && <div role="status" className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm flex items-center justify-between gap-3"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Zavřít oznámení"><X size={18}/></button></div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[[books.length,'Všechny výtisky',BookOpen], [books.length-borrowed,'Dostupné',CheckCircle2], [borrowed,'Vypůjčené',Clock3]].map(([value,label,Icon]) => <div key={label} className="bg-white border border-stone-200 shadow-sm rounded-2xl p-5 flex items-center gap-4"><div className="p-3 bg-emerald-50 rounded-xl text-emerald-800"><Icon size={25}/></div><div><p className="text-sm text-stone-500">{label}</p><p className="text-3xl font-bold">{value}</p></div></div>)}
        </div>
        <section className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-2">Vyhledat knihu podle názvu v knižním katalogu</h2>
          <p className="text-sm text-stone-500 mb-3">Automatické údaje načítáme z Google Books. Záznam před uložením zkontrolujte; databáze knih není přímo propojena.</p>
          <form onSubmit={searchTitles} className="flex flex-col sm:flex-row gap-2"><input className={inputStyle} value={lookup} onChange={e => setLookup(e.target.value)} placeholder="Např. Babička, Harry Potter, Malý princ" aria-label="Název knihy"/><button disabled={loading} className={buttonStyle + ' bg-emerald-800 text-white shrink-0'}><Search size={18}/> {loading ? 'Hledám…' : 'Najít titul'}</button></form>
          {!!lookupResults.length && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">{lookupResults.map(item => <div key={item.id} className="border border-stone-200 rounded-xl p-3 flex gap-3 items-start">{item.coverUrl ? <img src={item.coverUrl} alt="" className="w-14 h-20 object-cover rounded" /> : <div className="w-14 h-20 bg-stone-100 rounded shrink-0"/>}<div className="min-w-0"><p className="font-semibold text-sm">{item.title}</p><p className="text-xs text-stone-500">{item.authors}</p><button className="text-emerald-800 underline text-sm mt-2" onClick={() => setEditing(normalize({ ...item, id: createId(), section: 'Beletrie' }))}>Přidat výtisk</button></div></div>)}</div>}
        </section>
        {showSettings && <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-bold">Sekce knihovny a zálohování</h2><p className="text-sm text-stone-500">Sekce pomáhají roztřídit fond; konkrétní umístění zapisujte do pole Regál.</p>
          <div className="flex flex-wrap gap-2">{sections.map(s => <span key={s} className="bg-stone-100 rounded-full px-3 py-1 text-sm">{s}</span>)}</div>
          <form className="flex flex-wrap gap-2" onSubmit={e => {e.preventDefault(); const s=newSection.trim(); if(s && !sections.includes(s))setSections(a=>[...a,s]);setNewSection('');}}><input className={inputStyle + ' max-w-xs'} value={newSection} onChange={e=>setNewSection(e.target.value)} placeholder="Nová sekce"/><button className={buttonStyle + ' bg-emerald-800 text-white'}>Přidat sekci</button></form>
          <div className="flex flex-wrap items-center gap-2"><button className={buttonStyle + ' bg-stone-100'} onClick={exportJson}><Download size={17}/> Záloha JSON</button><button className={buttonStyle + ' bg-stone-100'} onClick={exportCsv}><Download size={17}/> Export CSV</button><label className={buttonStyle + ' bg-stone-100 cursor-pointer'}><Upload size={17}/> Importovat JSON<input className="sr-only" type="file" accept=".json,application/json" onChange={importJson}/></label></div>
        </section>}
        <section className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-stone-100"><div className="flex flex-wrap justify-between items-center gap-3 mb-4"><h2 className="text-xl font-bold">Knihovní fond <span className="text-stone-400 text-base font-normal">({filtered.length})</span></h2><button className={buttonStyle + ' bg-emerald-50 text-emerald-900'} onClick={() => setIsbnOpen(true)}><ScanLine size={17}/> Zadat ISBN ručně</button></div>
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2"><label className="relative"><Search className="absolute left-3 top-3 text-stone-400" size={19}/><input className={inputStyle + ' pl-10'} placeholder="Hledat název, autora, ISBN, regál…" value={query} onChange={e => setQuery(e.target.value)}/></label>
            <select className={inputStyle} value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} aria-label="Filtrovat sekci"><option value="all">Všechny sekce</option>{sections.map(s=><option key={s}>{s}</option>)}</select>
            <select className={inputStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filtrovat stav"><option value="all">Všechny stavy</option><option value="available">Dostupné</option><option value="borrowed">Vypůjčené</option></select>
          </div></div>
          {!filtered.length ? <div className="text-center p-16 text-stone-500"><BookOpen size={35} className="mx-auto mb-3 opacity-50"/><p>{books.length ? 'Žádné knihy neodpovídají filtrům.' : 'Katalog je prázdný. Začněte skenováním ISBN nebo přidáním knihy.'}</p></div> :
          <div className="divide-y divide-stone-100">{filtered.map(book => <article key={book.id} className="p-4 sm:p-5 flex flex-wrap sm:flex-nowrap gap-4 items-center hover:bg-stone-50">
            {book.coverUrl ? <img className="w-12 h-16 object-cover rounded border border-stone-200" src={book.coverUrl} alt="Obálka knihy"/> : <div className="w-12 h-16 shrink-0 flex items-center justify-center rounded bg-stone-100 text-stone-400"><BookOpen/></div>}
            <div className="flex-1 min-w-[180px]"><h3 className="font-semibold">{book.title}</h3><p className="text-sm text-stone-500">{book.authors || 'Autor neuveden'}{book.isbn ? ' · ISBN ' + book.isbn : ''}</p><p className="text-sm mt-1 flex items-center gap-1 text-stone-600"><MapPin size={14}/>{book.section} {book.shelf ? ' · Regál ' + book.shelf : ' · Regál neurčen'}</p></div>
            <div className="flex flex-wrap items-center gap-2"><button title="Kliknutím přepnete dostupnost výtisku" onClick={() => setBooks(a => a.map(b => b.id===book.id ? {...b,status:b.status==='borrowed'?'available':'borrowed'} : b))} className={'rounded-full px-3 py-2 text-sm font-bold ' + (book.status==='borrowed'?'bg-amber-100 text-amber-900':'bg-emerald-100 text-emerald-900')}>{book.status === 'borrowed' ? 'Vypůjčeno' : 'Dostupné'} ↔</button><button className="rounded-lg p-2 text-stone-600 hover:bg-stone-200" title="Upravit knihu" onClick={()=>setEditing({...book})}><Pencil size={19}/></button><button className="rounded-lg p-2 text-red-700 hover:bg-red-50" title="Smazat výtisk" onClick={()=>{if(window.confirm('Opravdu odstranit tento výtisk?'))setBooks(a=>a.filter(b=>b.id!==book.id));}}><Trash2 size={19}/></button></div>
          </article>)}</div>}
        </section>
      </main>
      <footer className="text-center text-stone-500 text-xs p-6">Knihovní katalog · Pracovní verze evidence knih</footer>
      <BarcodeScannerModal isOpen={scanOpen} onClose={()=>setScanOpen(false)} onDetected={processIsbn}/>
      <ManualIsbnModal isOpen={isbnOpen} onClose={()=>setIsbnOpen(false)} onSubmitIsbn={processIsbn}/>
      {editing && <div className="fixed inset-0 z-50 bg-stone-950/60 p-3 sm:p-6 overflow-y-auto flex items-start justify-center" role="dialog" aria-modal="true" aria-label="Údaje výtisku"><form onSubmit={e=>{e.preventDefault();upsert(editing);}} className="w-full max-w-xl bg-white rounded-2xl p-5 sm:p-7 my-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Údaje výtisku</h2><button type="button" onClick={()=>setEditing(null)} aria-label="Zavřít"><X/></button></div>
        <p className="text-sm text-stone-500">Každou fyzickou kopii knihy ukládejte jako samostatný výtisk. Dostupnost lze kdykoliv změnit.</p>
        {[['title','Název knihy'],['authors','Autor'],['isbn','ISBN'],['shelf','Regál / číslo police'],['coverUrl','URL obálky']].map(([key,label])=><label key={key} className="block"><span className="block text-sm font-medium mb-1">{label}</span><input required={key==='title'} className={inputStyle} value={editing[key]||''} onChange={e=>setEditing(b=>({...b,[key]:e.target.value}))}/></label>)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label><span className="block text-sm font-medium mb-1">Sekce</span><select className={inputStyle} value={editing.section} onChange={e=>setEditing(b=>({...b,section:e.target.value}))}>{!sections.includes(editing.section)&&<option>{editing.section}</option>}{sections.map(s=><option key={s}>{s}</option>)}</select></label>
        <label><span className="block text-sm font-medium mb-1">Stav výtisku</span><select className={inputStyle} value={editing.status} onChange={e=>setEditing(b=>({...b,status:e.target.value}))}><option value="available">Dostupné</option><option value="borrowed">Vypůjčené</option></select></label></div>
        <label className="block"><span className="block text-sm font-medium mb-1">Interní poznámka</span><textarea className={inputStyle} rows={2} value={editing.note||''} onChange={e=>setEditing(b=>({...b,note:e.target.value}))}/></label>
        <div className="flex justify-end gap-2"><button type="button" className={buttonStyle+' bg-stone-100'} onClick={()=>setEditing(null)}>Zrušit</button><button type="submit" className={buttonStyle+' bg-emerald-800 text-white'}>Uložit výtisk</button></div>
      </form></div>}
    </div>
  );
}
