import React, { useEffect, useMemo, useState, useRef } from 'react';
import { BookOpen, ScanLine, Search, Plus, Download, Upload, CheckCircle2, Clock3, MapPin, Pencil, Trash2, X, LibraryBig, AlertTriangle } from 'lucide-react';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ManualIsbnModal } from './components/ManualIsbnModal';
import { fetchBookByIsbn } from './services/bookService';
import { ShelvesView } from './components/ShelvesView';
import { AccountModal } from './components/AccountModal';
import { cloudEnabled, supabase } from './services/cloud';

const KEY = 'knihovna_books_v1';
const SECTION_KEY = 'knihovna_sections_v1';
const SHELF_KEY = 'knihovna_shelves_v1';
const DEFAULT_SHELVES = ['A1', 'A2', 'B1', 'B2'];
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
  borrower: book.borrower || '',
  borrowedAt: book.borrowedAt || '',
  dueDate: book.dueDate || '',
  addedAt: book.addedAt || new Date().toISOString(),
});
const CZECH_FALLBACK = [{ id:'verified:zuzanin-dech', title:'Zuzanin dech', authors:'Jakuba Katalpa', isbn:'9788027502417', publisher:'Host', publishedDate:'2020', description:'Román o Zuzaně, jejíž život zásadně zasáhne druhá světová válka a pronásledování Židů. Příběh sleduje proměny lidí a jejich vztahů v období protektorátu.', source:'Host / Národní knihovna ČR', coverUrl:'https://covers.openlibrary.org/b/isbn/9788027502417-M.jpg?default=false' }];
const normQuery = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs').trim();
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
function loadShelves() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHELF_KEY) || 'null');
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_SHELVES;
  } catch { return DEFAULT_SHELVES; }
}
function coverFor(book) {
  return book.coverUrl || (book.isbn && /^97[89]\d{10}$/.test(book.isbn) ? 'https://covers.openlibrary.org/b/isbn/' + book.isbn + '-M.jpg?default=false' : '');
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
  const [shelves, setShelves] = useState(loadShelves);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [isbnOpen, setIsbnOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lookup, setLookup] = useState('');
  const [lookupAuthor, setLookupAuthor] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [newSection, setNewSection] = useState('');
  const [newShelf, setNewShelf] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [activeView, setActiveView] = useState('catalog');
  const [accountOpen, setAccountOpen] = useState(false);
  const [cloudUser, setCloudUser] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('local');
  const [hasCloudData, setHasCloudData] = useState(false);
  const cloudRevision = useRef(0);
  const localSnapshot = useRef({books: loadBooks(), sections: loadSections(), shelves: loadShelves()});

  useEffect(() => { if (cloudUser) return; try { localStorage.setItem(KEY, JSON.stringify(books)); } catch { setMessage('Úložiště prohlížeče je plné nebo nedostupné. Exportujte zálohu.'); } }, [books, cloudUser]);
  useEffect(() => { if (!cloudUser) localStorage.setItem(SECTION_KEY, JSON.stringify(sections)); }, [sections, cloudUser]);
  useEffect(() => { if (!cloudUser) localStorage.setItem(SHELF_KEY, JSON.stringify(shelves)); }, [shelves, cloudUser]);

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    const loadAccount = async session => {
      const user = session?.user || null;
      if (!live) return;
      setCloudReady(false);
      setCloudUser(user);
      if (!user) { setCloudStatus('local'); setHasCloudData(false); setCloudReady(false); return; }
      setCloudStatus('loading');
      const { data, error } = await supabase.from('library_data').select('books, sections, shelves').eq('user_id', user.id).maybeSingle();
      if (!live) return;
      if (error) { setCloudStatus('error'); setMessage('Cloud: ' + error.message); return; }
      if (data) {
        setBooks(Array.isArray(data.books) ? data.books.map(normalize) : []);
        setSections(Array.isArray(data.sections) ? data.sections : DEFAULT_SECTIONS);
        setShelves(Array.isArray(data.shelves) ? data.shelves : DEFAULT_SHELVES);
        setHasCloudData(true);
        setCloudStatus('saved');
      } else {
        setBooks([]);
        setSections(DEFAULT_SECTIONS);
        setShelves(DEFAULT_SHELVES);
        setHasCloudData(false);
        setCloudStatus('empty');
      }
      cloudRevision.current += 1;
      setCloudReady(Boolean(data));
    };
    supabase.auth.getSession().then(({data}) => loadAccount(data.session)).catch(()=>setCloudStatus('error'));
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      // schedule outside the auth callback to avoid Supabase client deadlocks
      setTimeout(()=>{ if(live) loadAccount(session); }, 0);
    });
    return () => {live = false;subscription.unsubscribe();};
  }, []);

  useEffect(() => {
    if (!supabase || !cloudUser || !cloudReady) return;
    // Debounced sync for edits; delete is intentionally persisted too.
    setCloudStatus('saving');
    const currentRevision = ++cloudRevision.current;
    const timer = setTimeout(async () => {
      const { error } = await supabase.from('library_data').upsert({
        user_id: cloudUser.id, books, shelves, sections, updated_at: new Date().toISOString()
      }, {onConflict: 'user_id'});
      if (cloudRevision.current !== currentRevision) return;
      if (error) { setCloudStatus('error'); setMessage('Nepodařilo se uložit online: ' + error.message); }
      else {setCloudStatus('saved');setHasCloudData(true);}
    }, 900);
    return () => clearTimeout(timer);
  }, [cloudUser, cloudReady, books, sections, shelves]);

  const importLocalToCloud = () => {
    if (!cloudUser || hasCloudData) return;
    if (!window.confirm('Nahrát místní knihy do tohoto online účtu? Tím vytvoříte nový katalog pro přihlášený účet.')) return;
    setBooks(localSnapshot.current.books);
    setSections(localSnapshot.current.sections);
    setShelves(localSnapshot.current.shelves);
    setCloudReady(true);
    setCloudStatus('saving');
  };
  const startEmptyCloud = () => {setCloudReady(true);setCloudStatus('saving');};

  const today = new Date().toLocaleDateString('sv-SE');
  const overdueBooks = books.filter(b => b.status === 'borrowed' && b.dueDate && b.dueDate < today);
  const dueSoonBooks = books.filter(b => b.status === 'borrowed' && b.dueDate && b.dueDate >= today && b.dueDate <= new Date(Date.now()+7*86400000).toLocaleDateString('sv-SE'));
  const filtered = useMemo(() => books.filter(b => {
    const text = [b.title, b.authors, b.isbn, b.section, b.shelf, b.note, b.borrower].join(' ').toLocaleLowerCase('cs');
    return text.includes(query.toLocaleLowerCase('cs')) &&
      (statusFilter === 'all' || b.status === statusFilter) &&
      (sectionFilter === 'all' || b.section === sectionFilter) &&
      (!overdueOnly || (b.status === 'borrowed' && b.dueDate && b.dueDate < today));
  }).sort((a,b) => a.title.localeCompare(b.title, 'cs')), [books, query, statusFilter, sectionFilter, overdueOnly, today]);

  const borrowed = books.filter(b => b.status === 'borrowed').length;
  const shelfCount = shelves.length;
  const unsortedCount = books.filter(b => !b.shelf).length;

  const showOverdue = () => { setActiveView('catalog'); setStatusFilter('borrowed'); setSectionFilter('all'); setOverdueOnly(true); document.getElementById('library-catalog')?.scrollIntoView({behavior:'smooth'}); };
  const showAvailable = () => {setActiveView('catalog'); setStatusFilter('available'); setOverdueOnly(false); document.getElementById('library-catalog')?.scrollIntoView({behavior:'smooth'});};
  const returnBook = book => { if (!window.confirm('Potvrdit vrácení knihy „' + book.title + '“?')) return; setBooks(prev => prev.map(b => b.id === book.id ? {...b,status:'available',borrower:'',borrowedAt:'',dueDate:''} : b)); setMessage('Vrácení knihy bylo zaznamenáno.'); };

  const upsert = book => {
    const finalBook = normalize(book);
    if (!finalBook.title.trim()) { setMessage('Vyplňte název knihy.'); return; }
    if (finalBook.status === 'borrowed' && !finalBook.borrower.trim()) { setMessage('Při výpůjčce vyplňte jméno nebo identifikátor čtenáře.'); return; }
    if (finalBook.status === 'available') { finalBook.borrower = ''; finalBook.borrowedAt = ''; finalBook.dueDate = ''; }
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
    const q=lookup.trim(), author=lookupAuthor.trim();
    if(!q)return;
    setLoading(true);setLookupResults([]);setMessage('');
    const results=[], seen=new Set();
    const add=item=>{if(!item.title)return;const key=(item.isbn||item.title+'|'+item.authors).toLowerCase();if(!seen.has(key)){seen.add(key);results.push(item);}};
    const addGoogle=data=>(data?.items||[]).forEach(v=>{const i=v.volumeInfo||{};add({
      id:'google:'+v.id,title:i.title||'',authors:(i.authors||[]).join(', '),
      isbn:(i.industryIdentifiers||[]).find(x=>x.type==='ISBN_13')?.identifier||(i.industryIdentifiers||[])[0]?.identifier||'',
      coverUrl:(i.imageLinks?.thumbnail||i.imageLinks?.smallThumbnail||'').replace(/^http:/,'https:'),
      publisher:i.publisher||'',publishedDate:i.publishedDate||'',pageCount:i.pageCount||'',
      genre:(i.categories||[]).join(', '),description:(i.description||'').replace(/<[^>]*>/g,'').slice(0,1400),source:'Google Books'});});
    // Czech national library portal: include title/author/ISBN and a cover only if its API returns a direct image URL.
    const addKnihovny=data=>(data?.records||[]).forEach(i=>{
      const isbn=(Array.isArray(i.isbns)?i.isbns:[]).map(v=>String(v).replace(/[^0-9X]/gi,'')).find(v=>/^97[89]\d{10}$/.test(v))||'';
      const title=typeof i.title==='string'?i.title.trim():'';
      const names=i.authors?.primary?Object.keys(i.authors.primary):[];
      const authors=names.map(v=>v.replace(/,?\s*\d{4}\s*-\s*\d{0,4}/g,'').trim()).join(', ');
      const imageCandidates=[i.coverUrl,i.cover,i.thumbnail,i.imageUrl];
      const coverUrl=imageCandidates.find(v=>typeof v==='string'&&/^https:\/\//i.test(v))||'';
      const description=(Array.isArray(i.summary)?i.summary.join(' '):typeof i.summary==='string'?i.summary:'').slice(0,1400);
      add({id:'knihovny:'+String(i.id||isbn||title),title,authors,isbn,coverUrl,
        publisher:Array.isArray(i.publishers)?i.publishers[0]||'':'',
        publishedDate:Array.isArray(i.publicationDates)?String(i.publicationDates[0]||''):'',
        description,source:'Knihovny.cz'});
    });
    const addOpen=data=>(data?.docs||[]).forEach(i=>add({id:'open:'+i.key,title:i.title||'',
      authors:(i.author_name||[]).join(', '),isbn:(i.isbn||[]).find(x=>/^97[89]\d{10}$/.test(x))||'',
      coverUrl:i.cover_i?'https://covers.openlibrary.org/b/id/'+i.cover_i+'-M.jpg':'',
      publisher:(i.publisher||[])[0]||'',publishedDate:i.first_publish_year||'',
      description:typeof i.first_sentence==='string'?i.first_sentence:(i.first_sentence||[])[0]||'',source:'Open Library'}));
    try{
      const openParams=new URLSearchParams({title:q,...(author?{author}:{}),limit:'30',
        fields:'key,title,author_name,first_publish_year,cover_i,isbn,publisher,first_sentence'});
      const czParams=new URLSearchParams({lookfor:q+(author?' '+author:''),type:'AllFields',limit:'20'});
      ['id','title','authors','isbns','publishers','publicationDates','summary','coverUrl'].forEach(field=>czParams.append('field[]',field));
      const urls=[
        ['https://www.knihovny.cz/api/v1/search?'+czParams.toString(),addKnihovny],
        ['https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent('intitle:'+q+(author?' inauthor:'+author:''))+'&maxResults=40',addGoogle],
        ['https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(q+' '+author)+'&maxResults=40',addGoogle],
        ['https://openlibrary.org/search.json?'+openParams,addOpen]
      ];
      await Promise.allSettled(urls.map(async ([url,collect])=>{const r=await fetch(url);if(!r.ok)throw Error('Catalog error');collect(await r.json());}));
      const title=normQuery(q), writer=normQuery(author);
      CZECH_FALLBACK.forEach(item=>{if(normQuery(item.title).includes(title)&&(!writer||normQuery(item.authors).includes(writer)))add(item);});
      const ranked=results.filter(item=>normQuery(item.title).includes(title)||title.split(/\s+/).every(part=>normQuery(item.title).includes(part)))
        .sort((x,y)=>{
          const score=i=>(normQuery(i.title)===title?100:normQuery(i.title).startsWith(title)?60:20)
            +(writer&&normQuery(i.authors).includes(writer)?40:0)+(i.description?7:0)+(i.coverUrl?5:0);
          return score(y)-score(x);
        });
      setLookupResults(ranked);
      if(!ranked.length)setMessage('Titul se v připojených katalozích nenašel. Zkuste název bez autora nebo ruční přidání.');
    }catch{setMessage('Vyhledávání dočasně nefunguje. Knihu můžete přidat ručně.');}
    finally{setLoading(false);}
  };

  const exportJson = () => download('knihovna-zaloha.json', JSON.stringify({ version: 2, books, sections, shelves, exportedAt: new Date().toISOString() }, null, 2), 'application/json');
  const exportCsv = () => {
    const cols = ['title','authors','isbn','section','shelf','status','borrower','borrowedAt','dueDate','publisher','publishedDate','pageCount','note'];
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
      if (Array.isArray(data.shelves) && data.shelves.length) setShelves(data.shelves);
      setMessage('Záloha byla načtena.');
    } catch { setMessage('Soubor není platná JSON záloha knihovny.'); }
    finally { event.target.value = ''; }
  };

  const inputStyle = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700';
  const buttonStyle = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition hover:opacity-90';
  return (
    <div className="min-h-screen bg-[#f8f7f3] text-stone-800">
      <header className="bg-[#193c34] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#315a4e] p-3"><LibraryBig size={27}/></div>
            <div><p className="text-[11px] tracking-[.18em] uppercase text-emerald-200">Správa knihovny</p><h1 className="text-2xl font-bold tracking-tight">Knihovní systém</h1></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-xl px-4 py-2.5 text-sm font-semibold border border-white/20 hover:bg-white/10" onClick={()=>setAccountOpen(true)}>{cloudUser ? '☁ ' + (cloudUser.email || 'Můj účet') : 'Přihlásit se'}</button>
            <button className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-[#214b3e] hover:bg-stone-100 flex items-center gap-2" onClick={()=>setScanOpen(true)}><ScanLine size={18}/> Skenovat</button>
            <button className="rounded-xl px-4 py-2.5 text-sm font-semibold bg-[#d6e7d2] text-[#193c34] hover:bg-[#c4ddbf] flex items-center gap-2" onClick={()=>setIsbnOpen(true)}>⌨ ISBN ručně</button>
          </div>
        </div>
      </header>
      <nav className="bg-white border-b border-stone-200 shadow-sm" aria-label="Hlavní navigace">
        <div className="mx-auto max-w-7xl px-4 sm:px-7 py-2 flex flex-wrap gap-2 items-center">
          <button onClick={()=>setActiveView('catalog')} aria-current={activeView==='catalog'?'page':undefined} className={'px-4 py-3 rounded-xl text-sm font-semibold transition ' + (activeView==='catalog'?'bg-[#e5efe7] text-[#214d3b]':'text-stone-500 hover:bg-stone-100')}>Knihovní fond</button>
          <button onClick={()=>setActiveView('shelves')} aria-current={activeView==='shelves'?'page':undefined} className={'px-4 py-3 rounded-xl text-sm font-semibold transition ' + (activeView==='shelves'?'bg-[#e5efe7] text-[#214d3b]':'text-stone-500 hover:bg-stone-100')}>Regály <span className="opacity-60">{shelfCount}</span></button>
          <div className="flex-1"/>
          <button onClick={()=>setEditing(emptyBook())} className="px-4 py-3 rounded-xl text-sm font-semibold text-emerald-800 hover:bg-emerald-50 flex items-center gap-1"><Plus size={17}/> Nová kniha</button>
          <button onClick={()=>{setActiveView('catalog');setShowSettings(v=>!v);}} className="px-4 py-3 rounded-xl text-sm font-semibold text-stone-500 hover:bg-stone-100">Nastavení</button>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-7 space-y-6">
        {!cloudUser && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"><span className="flex items-center gap-2"><AlertTriangle size={17} className="text-amber-600 shrink-0"/>{cloudEnabled ? 'Pracujete bez přihlášení. Změny se ukládají jen na tomto zařízení.' : 'Online knihovna zatím není aktivována. Změny se ukládají pouze do tohoto zařízení.'}</span><div className="flex gap-2"><button className="font-semibold text-emerald-900 underline" onClick={()=>setAccountOpen(true)}>{cloudEnabled ? 'Přihlásit se' : 'Jak aktivovat účet'}</button><button className="font-semibold text-stone-600 underline" onClick={exportJson}>Stáhnout zálohu</button></div></div>}
        {cloudUser && <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 flex flex-wrap justify-between gap-2 items-center text-sm">
          <span>☁ Online účet: <strong>{cloudUser.email}</strong> · {cloudStatus === 'saved' ? 'Uloženo online' : cloudStatus === 'saving' ? 'Ukládám…' : cloudStatus === 'loading' ? 'Načítám…' : cloudStatus === 'empty' ? 'Prázdný online katalog' : cloudStatus === 'error' ? 'Chyba synchronizace' : 'Připraveno'}</span>
          {!hasCloudData && !cloudReady && cloudStatus === 'empty' && <div className="flex flex-wrap gap-2"><button onClick={importLocalToCloud} className="bg-emerald-800 text-white rounded-lg px-3 py-2">Převzít místní knihy</button><button onClick={startEmptyCloud} className="bg-stone-100 rounded-lg px-3 py-2">Začít s prázdným katalogem</button></div>}
        </div>}
        {message && <div role="status" className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm flex items-center justify-between gap-3"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Zavřít oznámení"><X size={18}/></button></div>}
        <section className="relative overflow-hidden rounded-[2rem] bg-[#173b32] p-6 sm:p-9 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-14 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5"/>
          <div className="relative flex flex-wrap justify-between gap-5 items-start">
            <div><p className="text-xs uppercase tracking-[.2em] text-emerald-200 font-bold">Pracovní přehled</p><h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">Dobrý den, milá paní knihovnice! <span aria-hidden="true">📚</span></h2><p className="text-emerald-100/80 mt-2 max-w-xl">Vítejte zpátky ve své knihovně. Tady máte dnešní přehled výpůjček, vrácení a knih, které čekají na své místo.</p></div>
            
          </div>
          <div className="relative mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[[books.length,'Výtisků v katalogu',BookOpen,'all'],[books.length-borrowed,'Připraveno k půjčení',CheckCircle2,'available'],[borrowed,'Právě vypůjčeno',Clock3,'borrowed'],[overdueBooks.length,'Po termínu vrácení',AlertTriangle,'overdue']].map(([value,label,Icon,filter])=><button key={label} onClick={()=>{if(filter==='overdue')showOverdue();else if(filter==='available')showAvailable();else {setActiveView('catalog');setOverdueOnly(false);setStatusFilter(filter);}}} className="text-left rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5 hover:bg-white/20 transition focus-visible:outline-2 focus-visible:outline-white"><Icon size={22} className={filter==='overdue'&&value?'text-amber-300':'text-emerald-200'}/><strong className="block mt-3 text-3xl font-bold">{value}</strong><span className="text-xs sm:text-sm text-emerald-50/85">{label}</span></button>)}
          </div>
        </section>
        {(overdueBooks.length > 0 || dueSoonBooks.length > 0 || unsortedCount > 0) && <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white border border-stone-200 p-4 text-sm">
          <strong className="text-stone-800">K vyřízení:</strong>
          {overdueBooks.length > 0 && <button onClick={showOverdue} className="rounded-full bg-rose-50 text-rose-800 px-3 py-2 font-semibold hover:bg-rose-100">{overdueBooks.length} po termínu →</button>}
          {dueSoonBooks.length > 0 && <span className="rounded-full bg-amber-50 text-amber-900 px-3 py-2">{dueSoonBooks.length} výpůjček končí do 7 dnů</span>}
          {unsortedCount > 0 && <button onClick={()=>setActiveView('shelves')} className="rounded-full bg-emerald-50 text-emerald-900 px-3 py-2 font-semibold hover:bg-emerald-100">{unsortedCount} knih bez regálu →</button>}
        </div>}
        {activeView === 'shelves' && <ShelvesView books={books} shelves={shelves} sections={sections}
          onAddShelf={name => setShelves(prev => prev.includes(name) ? prev : [...prev, name])}
          onMoveBook={(id, shelf) => setBooks(prev => prev.map(book => book.id===id ? {...book,shelf} : book))}
          onEditBook={book => setEditing({...book})} />}
        {activeView === 'catalog' && <>
        <section className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 sm:p-7 shadow-sm" aria-labelledby="title-search-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[.16em] text-emerald-700 font-bold">Nejrychlejší způsob přidání</p><h2 id="title-search-heading" className="text-xl sm:text-2xl font-bold mt-1">Přidat knihu podle názvu</h2><p className="text-sm text-stone-600 mt-2">Napište název a případně autora. Vyberte vydání, zkontrolujte údaje a uložte výtisk do regálu.</p></div>
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900 font-semibold">Není potřeba ISBN</div>
          </div>
          <form onSubmit={searchTitles} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] items-end">
            <label className="block"><span className="block text-xs font-semibold text-stone-700 mb-1">Název knihy *</span><input className={inputStyle} required value={lookup} onChange={e => setLookup(e.target.value)} placeholder="Např. Babička" autoComplete="off"/></label>
            <label className="block"><span className="block text-xs font-semibold text-stone-700 mb-1">Autor (volitelné)</span><input className={inputStyle} value={lookupAuthor} onChange={e => setLookupAuthor(e.target.value)} placeholder="Božena Němcová" autoComplete="off"/></label>
            <button disabled={loading || !lookup.trim()} type="submit" className={buttonStyle + ' bg-emerald-800 text-white shrink-0 disabled:opacity-50'}><Search size={18}/> {loading ? 'Hledám…' : 'Vyhledat knihu'}</button>
          </form>
          <p className="mt-3 text-xs text-stone-500">Vyhledáváme v Knihovny.cz, Google Books a Open Library. České obálky ze služby ObálkyKnih.cz vyžadují registraci knihovny; do její aktivace je nelze automaticky přebírat.</p>
          <a className="inline-flex text-sm font-semibold text-emerald-900 underline mt-2" href={'https://www.databazeknih.cz/search?q='+encodeURIComponent([lookup,lookupAuthor].filter(Boolean).join(' '))} target="_blank" rel="noopener noreferrer">Porovnat hledání v Databázi knih ↗</a><a className="inline-flex ml-4 text-sm font-semibold text-emerald-900 underline mt-2" href={'https://www.knihovny.cz/Search/Results?lookfor='+encodeURIComponent([lookup,lookupAuthor].filter(Boolean).join(' '))+'&type=AllFields'} target="_blank" rel="noopener noreferrer">Ověřit v Knihovny.cz ↗</a><a className="inline-flex ml-4 text-sm font-semibold text-emerald-900 underline mt-2" href="https://obalkyknih.cz/for_libraries" target="_blank" rel="noopener noreferrer">ObálkyKnih.cz – zapojení knihovny ↗</a>
          {!!lookupResults.length && <div className="mt-6"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-bold text-stone-700">Nalezené knihy ({lookupResults.length}) – vyberte odpovídající vydání</h3><button type="button" onClick={()=>setLookupResults([])} aria-label="Zavřít výsledky vyhledávání" className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-emerald-700"><X size={17}/> Zavřít výsledky</button></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{lookupResults.map(item => <article key={item.id} className="border border-stone-200 rounded-2xl p-3 flex gap-3 items-start hover:border-emerald-400 hover:shadow-sm transition">{item.coverUrl ? <img src={item.coverUrl} loading="lazy" alt={'Obálka knihy '+item.title} className="w-16 h-24 object-cover rounded-md shrink-0 bg-stone-100" onError={e=>{e.currentTarget.style.visibility='hidden';}}/> : <div className="w-16 h-24 bg-stone-100 rounded-md shrink-0 flex items-center justify-center text-stone-400"><BookOpen size={22}/></div>}<div className="min-w-0 flex-1"><h4 className="font-bold text-sm leading-snug">{item.title}</h4><p className="text-xs text-stone-600 mt-1">{item.authors || 'Autor neuveden'}</p><p className="text-xs text-stone-500 mt-1">{[item.publishedDate, item.publisher, item.isbn ? 'ISBN '+item.isbn : ''].filter(Boolean).join(' · ')}</p>{item.description && <p className="text-xs text-stone-600 mt-2 line-clamp-3">{item.description}</p>}<p className="text-[11px] text-stone-400 mt-1">{item.source}</p><button type="button" className="rounded-lg bg-emerald-800 text-white font-bold text-xs px-3 py-2 mt-3 hover:bg-emerald-900" onClick={() => setEditing(normalize({ ...item, id: createId(), section: 'Beletrie', status:'available', shelf:'' }))}>+ Přidat tento výtisk</button></div></article>)}</div></div>}

        </section>
        {showSettings && <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-bold">Regály, sekce a zálohování</h2><p className="text-sm text-stone-500">Sekce pomáhají roztřídit fond; konkrétní umístění zapisujte do pole Regál.</p>
          <div className="flex flex-wrap gap-2">{sections.map(s => <span key={s} className="bg-stone-100 rounded-full px-3 py-1 text-sm">{s}</span>)}</div>
          <form className="flex flex-wrap gap-2" onSubmit={e => {e.preventDefault(); const s=newSection.trim(); if(s && !sections.includes(s))setSections(a=>[...a,s]);setNewSection('');}}><input className={inputStyle + ' max-w-xs'} value={newSection} onChange={e=>setNewSection(e.target.value)} placeholder="Nová sekce"/><button className={buttonStyle + ' bg-emerald-800 text-white'}>Přidat sekci</button></form>
          <div className="border-t border-stone-100 pt-4"><h3 className="font-semibold mb-2">Regály</h3><div className="flex flex-wrap gap-2 mb-3">{shelves.map(sh => <span key={sh} className="bg-emerald-50 text-emerald-900 rounded-lg px-3 py-2 text-sm">{sh} <button title={'Odstranit regál ' + sh} onClick={() => { if(books.some(b=>b.shelf===sh)){setMessage('Regál používají uložené knihy. Nejprve je přesuňte.');return;}setShelves(a=>a.filter(v=>v!==sh)); }} aria-label={'Odstranit ' + sh} className="ml-2">×</button></span>)}</div><form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();const sh=newShelf.trim();if(sh&&!shelves.includes(sh))setShelves(a=>[...a,sh]);setNewShelf('');}}><input className={inputStyle+' max-w-xs'} value={newShelf} onChange={e=>setNewShelf(e.target.value)} placeholder="Např. A3 nebo Regál 5"/><button className={buttonStyle+' bg-emerald-800 text-white'}>Vytvořit regál</button></form></div>
          <div className="flex flex-wrap items-center gap-2"><button className={buttonStyle + ' bg-stone-100'} onClick={exportJson}><Download size={17}/> Záloha JSON</button><button className={buttonStyle + ' bg-stone-100'} onClick={exportCsv}><Download size={17}/> Export CSV</button><label className={buttonStyle + ' bg-stone-100 cursor-pointer'}><Upload size={17}/> Importovat JSON<input className="sr-only" type="file" accept=".json,application/json" onChange={importJson}/></label></div>
        </section>}
        <section id="library-catalog" className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden scroll-mt-6">
          <div className="p-5 border-b border-stone-100"><div className="flex flex-wrap justify-between items-center gap-3 mb-4"><h2 className="text-xl font-bold">Knihovní fond <span className="text-stone-400 text-base font-normal">({filtered.length})</span></h2></div>
          {overdueOnly && <div className="mb-3 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-900"><span>Zobrazují se pouze výpůjčky po termínu.</span><button onClick={()=>setOverdueOnly(false)} className="font-bold underline">Zrušit filtr</button></div>}
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2"><label className="relative"><Search className="absolute left-3 top-3 text-stone-400" size={19}/><input className={inputStyle + ' pl-10'} placeholder="Hledat název, autora, ISBN, regál…" value={query} onChange={e => setQuery(e.target.value)}/></label>
            <select className={inputStyle} value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} aria-label="Filtrovat sekci"><option value="all">Všechny sekce</option>{sections.map(s=><option key={s}>{s}</option>)}</select>
            <select className={inputStyle} value={statusFilter} onChange={e => {setStatusFilter(e.target.value);setOverdueOnly(false);}} aria-label="Filtrovat stav"><option value="all">Všechny stavy</option><option value="available">Dostupné</option><option value="borrowed">Vypůjčené</option></select>
          </div></div>
          {!filtered.length ? <div className="text-center p-16 text-stone-500"><BookOpen size={35} className="mx-auto mb-3 opacity-50"/><p>{books.length ? 'Žádné knihy neodpovídají filtrům.' : 'Katalog je prázdný. Začněte skenováním ISBN nebo přidáním knihy.'}</p></div> :
          <div className="divide-y divide-stone-100">{filtered.map(book => <article key={book.id} className="p-4 sm:p-5 flex flex-wrap sm:flex-nowrap gap-4 items-center hover:bg-stone-50">
            {coverFor(book) ? <img className="w-12 h-16 object-cover rounded border border-stone-200" src={coverFor(book)} onError={e=>{e.currentTarget.style.display='none';}} alt="Obálka knihy"/> : <div className="w-12 h-16 shrink-0 flex items-center justify-center rounded bg-stone-100 text-stone-400"><BookOpen/></div>}
            <div className="flex-1 min-w-[180px]"><h3 className="font-semibold">{book.title}</h3><p className="text-sm text-stone-500">{book.authors || 'Autor neuveden'}</p><p className="text-sm mt-1 flex items-center gap-1 text-stone-600"><MapPin size={14}/>{book.section} {book.shelf ? ' · Regál ' + book.shelf : ' · Regál neurčen'}{book.borrower ? ' · Čtenář: ' + book.borrower : ''}</p><details className="group mt-2 text-xs text-stone-600"><summary className="cursor-pointer text-emerald-800 font-semibold"><span className="group-open:hidden">Zobrazit více o knize</span><span className="hidden group-open:inline">Zobrazit méně</span></summary><div className="mt-2 space-y-1"><p>ISBN: {book.isbn || 'Neuvedeno'}</p>{book.publisher && <p>Nakladatelství: {book.publisher}</p>}{book.publishedDate && <p>Vydání: {book.publishedDate}</p>}{book.description && <p className="leading-relaxed">{book.description}</p>}{book.note && <p>Interní poznámka: {book.note}</p>}</div></details>{book.status==='borrowed' && book.dueDate && <p className={'text-xs font-semibold mt-1 ' + (book.dueDate < today ? 'text-rose-700':'text-amber-700')}>{book.dueDate < today ? 'Po termínu: ' : 'Vrátit do: '}{new Date(book.dueDate+'T12:00:00').toLocaleDateString('cs-CZ')}</p>}</div>
            <div className="flex flex-wrap items-center gap-2">{book.status === 'borrowed' ? <button onClick={()=>returnBook(book)} className="rounded-full bg-amber-100 text-amber-950 px-3 py-2 text-sm font-bold hover:bg-amber-200">Potvrdit vrácení</button> : <button onClick={()=>setEditing({...book,status:'borrowed',borrowedAt:today})} className="rounded-full bg-emerald-100 text-emerald-950 px-3 py-2 text-sm font-bold hover:bg-emerald-200">Půjčit knihu</button>}<button className="rounded-lg p-2 text-stone-600 hover:bg-stone-200" title="Upravit knihu" onClick={()=>setEditing({...book})}><Pencil size={19}/></button><button className="rounded-lg p-2 text-red-700 hover:bg-red-50" title="Smazat výtisk" onClick={()=>{if(window.confirm('Opravdu odstranit tento výtisk?'))setBooks(a=>a.filter(b=>b.id!==book.id));}}><Trash2 size={19}/></button></div>
          </article>)}</div>}
        </section>
        </>}
      </main>
      <footer className="text-center text-stone-500 text-xs p-6">Knihovna · Přehledná evidence knih a regálů · Pracovní verze</footer>
      <AccountModal open={accountOpen} user={cloudUser} onClose={()=>setAccountOpen(false)} onLogout={async()=>{await supabase.auth.signOut();setAccountOpen(false);window.location.reload();}}/>
      <BarcodeScannerModal isOpen={scanOpen} onClose={()=>setScanOpen(false)} onDetected={processIsbn} onManual={() => {setScanOpen(false);setIsbnOpen(true);}}/>
      <ManualIsbnModal isOpen={isbnOpen} onClose={()=>setIsbnOpen(false)} onSubmitIsbn={processIsbn}/>
      {editing && <div className="fixed inset-0 z-50 bg-stone-950/60 p-3 sm:p-6 overflow-y-auto flex items-start justify-center" role="dialog" aria-modal="true" aria-label="Údaje výtisku"><form onSubmit={e=>{e.preventDefault();upsert(editing);}} className="w-full max-w-3xl bg-white rounded-2xl p-5 sm:p-7 my-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Údaje výtisku</h2><button type="button" onClick={()=>setEditing(null)} aria-label="Zavřít"><X/></button></div>
        <p className="text-sm text-stone-500">Vyplňte základní údaje a umístění. Ostatní informace si rozbalte pouze podle potřeby.</p>
        <div className="flex flex-col sm:flex-row gap-5 rounded-xl bg-stone-50 p-4">{coverFor(editing) ? <img src={coverFor(editing)} onError={e=>{e.currentTarget.style.display='none';}} alt="Obálka knihy" className="w-32 h-44 object-contain rounded-lg shadow bg-white shrink-0"/> : <div className="w-32 h-44 bg-stone-200 rounded-xl flex items-center justify-center text-stone-500"><BookOpen size={40}/></div>}<div className="min-w-0 space-y-2"><h3 className="text-xl font-bold">{editing.title || 'Nová kniha'}</h3><p className="text-stone-500">{editing.authors || 'Autor nezadán'}</p><details className="group text-sm text-stone-600"><summary className="cursor-pointer font-semibold text-emerald-800"><span className="group-open:hidden">Zobrazit více informací</span><span className="hidden group-open:inline">Zobrazit méně</span></summary><p className="mt-2">{[editing.genre,editing.publisher,editing.publishedDate,editing.pageCount ? editing.pageCount + ' stran' : ''].filter(Boolean).join(' · ')}</p><p className="mt-2 leading-relaxed max-h-32 overflow-auto">{editing.description || 'Anotace knihy zatím není v katalogu dostupná.'}</p></details></div></div>
        <div className="grid sm:grid-cols-2 gap-3">{[['title','Název knihy'],['authors','Autor']].map(([key,label])=><label key={key} className="block"><span className="block text-sm font-medium mb-1">{label}</span><input required={key==='title'} className={inputStyle} value={editing[key]||''} onChange={e=>setEditing(b=>({...b,[key]:e.target.value}))}/></label>)}</div>
        <details className="group rounded-2xl border border-stone-200 p-4"><summary className="cursor-pointer font-semibold text-emerald-900"><span className="group-open:hidden">Další údaje o knize – zobrazit více</span><span className="hidden group-open:inline">Další údaje – zobrazit méně</span></summary><div className="mt-4 grid sm:grid-cols-2 gap-3">{[['isbn','ISBN'],['publisher','Nakladatelství'],['publishedDate','Rok vydání'],['genre','Žánr'],['pageCount','Počet stran']].map(([key,label])=><label key={key} className="block"><span className="block text-sm font-medium mb-1">{label}</span><input className={inputStyle} value={editing[key]||''} onChange={e=>setEditing(b=>({...b,[key]:e.target.value}))}/></label>)}</div>
        <label className="block mt-3"><span className="block text-sm font-medium mb-1">Krátký popis knihy</span><textarea className={inputStyle} rows={3} maxLength={1400} placeholder="Stručně o čem kniha je…" value={editing.description||''} onChange={e=>setEditing(b=>({...b,description:e.target.value}))}/></label></details>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label><span className="block text-sm font-medium mb-1">Sekce</span><select className={inputStyle} value={editing.section} onChange={e=>setEditing(b=>({...b,section:e.target.value}))}>{!sections.includes(editing.section)&&<option>{editing.section}</option>}{sections.map(s=><option key={s}>{s}</option>)}</select></label>
        <label><span className="block text-sm font-medium mb-1">Regál</span><select className={inputStyle} value={editing.shelf||''} onChange={e=>setEditing(b=>({...b,shelf:e.target.value}))}><option value="">Nezařazeno</option>{editing.shelf && !shelves.includes(editing.shelf) && <option>{editing.shelf}</option>}{shelves.map(sh=><option key={sh}>{sh}</option>)}</select></label><label><span className="block text-sm font-medium mb-1">Stav výtisku</span><select className={inputStyle} value={editing.status} onChange={e=>setEditing(b=>({...b,status:e.target.value}))}><option value="available">Dostupné</option><option value="borrowed">Vypůjčené</option></select></label></div>
        {editing.status === 'borrowed' && <div className="grid sm:grid-cols-3 gap-3 rounded-xl bg-amber-50 p-4"><label><span className="block text-sm font-medium mb-1">Kdo si vypůjčil *</span><input className={inputStyle} required value={editing.borrower||''} placeholder="Jméno / ID čtenáře" onChange={e=>setEditing(b=>({...b,borrower:e.target.value}))}/></label><label><span className="block text-sm font-medium mb-1">Datum výpůjčky</span><input type="date" className={inputStyle} value={editing.borrowedAt||''} onChange={e=>setEditing(b=>({...b,borrowedAt:e.target.value}))}/></label><label><span className="block text-sm font-medium mb-1">Vrátit do</span><input type="date" className={inputStyle} value={editing.dueDate||''} onChange={e=>setEditing(b=>({...b,dueDate:e.target.value}))}/></label></div>}
        <details className="group rounded-2xl border border-stone-200 p-4"><summary className="cursor-pointer font-semibold text-emerald-900"><span className="group-open:hidden">Interní poznámka – zobrazit více</span><span className="hidden group-open:inline">Interní poznámka – zobrazit méně</span></summary><label className="block mt-3"><span className="block text-sm font-medium mb-1">Interní poznámka</span><textarea className={inputStyle} rows={2} value={editing.note||''} onChange={e=>setEditing(b=>({...b,note:e.target.value}))}/></label></details>
        <div className="flex justify-end gap-2"><button type="button" className={buttonStyle+' bg-stone-100'} onClick={()=>setEditing(null)}>Zrušit</button><button type="submit" className={buttonStyle+' bg-emerald-800 text-white'}>Uložit výtisk</button></div>
      </form></div>}
    </div>
  );
}
