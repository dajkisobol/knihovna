import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRightLeft, BookOpen, Check, FolderPlus, LibraryBig, Search, X } from 'lucide-react';

const SPINE_COLORS = ['#416b61', '#a97457', '#64839b', '#826b91', '#c49855', '#567b79', '#956e6a'];
const colorFor = (book) => SPINE_COLORS[Array.from(book.title || '').reduce((sum, char) => sum + char.charCodeAt(0), 0) % SPINE_COLORS.length];

export function ShelvesView({ books, shelves, sections, onAddShelf, onMoveBook, onEditBook }) {
  const [activeShelf, setActiveShelf] = useState(null);
  const [newShelf, setNewShelf] = useState('');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('all');
  const shelfNames = useMemo(() => [...shelves, ...(books.some(book => !book.shelf) ? [''] : [])], [shelves, books]);
  const currentShelf = shelfNames.includes(activeShelf) ? activeShelf : null;
  const visibleBooks = useMemo(() => books
    .filter(book => currentShelf !== null && (book.shelf || '') === currentShelf)
    .filter(book => section === 'all' || book.section === section)
    .filter(book => [book.title, book.authors, book.isbn].join(' ').toLocaleLowerCase('cs').includes(query.toLocaleLowerCase('cs')))
    .sort((a, b) => a.title.localeCompare(b.title, 'cs')), [books, currentShelf, query, section]);

  const handleAdd = event => {
    event.preventDefault();
    const name = newShelf.trim();
    if (!name || shelves.includes(name)) return;
    onAddShelf(name);
    setNewShelf('');
    setActiveShelf(name);
  };

  return <section className="space-y-6" aria-label="Vizuální regály">
    {currentShelf === null ? <>
      <div className="flex flex-col md:flex-row gap-5 md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[.18em] uppercase text-emerald-700 mb-2">Organizace knihovního fondu</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#233d35]">Moje regály</h2>
          <p className="text-stone-500 mt-2">Otevřete regál a uvidíte všechny jeho knihy. Každou můžete jednoduše přesunout.</p>
        </div>
        <form onSubmit={handleAdd} className="flex gap-2 max-w-sm w-full">
          <input className="flex-1 min-w-0 rounded-xl border border-stone-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-emerald-600" value={newShelf} onChange={e => setNewShelf(e.target.value)} placeholder="Název nového regálu" aria-label="Název nového regálu" />
          <button type="submit" disabled={!newShelf.trim() || shelves.includes(newShelf.trim())} className="flex items-center gap-2 rounded-xl bg-[#245c4d] text-white px-4 font-semibold disabled:opacity-50"><FolderPlus size={18} /> Přidat</button>
        </form>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {shelfNames.map(name => {
          const items = books.filter(book => (book.shelf || '') === name);
          return <button key={name || '__unsorted'} onClick={() => {setActiveShelf(name); setQuery(''); setSection('all');}}
            className="group text-left rounded-3xl bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-200">
            <div className="p-5 pb-3 flex items-center justify-between">
              <div><span className="text-xs uppercase font-semibold tracking-wider text-stone-400">Knihovní regál</span><h3 className="text-2xl font-bold text-[#25473f]">{name || 'Nezařazené knihy'}</h3></div>
              <span className="text-xs font-semibold bg-[#eff5f0] text-emerald-900 px-3 py-2 rounded-full">{items.length} {items.length === 1 ? 'výtisk' : 'výtisků'}</span>
            </div>
            <div className="relative mx-5 mt-4 mb-5 rounded-t-lg bg-[#f1e7d6] border-x-[12px] border-[#ba9674] h-44 flex items-end justify-center px-2 pt-4 gap-1 overflow-hidden">
              {items.slice(0, 13).map((book, index) => <div key={book.id || index} title={book.title} className="rounded-t-sm shrink min-w-[8px] max-w-[25px] flex-1 relative" style={{ height: (55 + (index * 17) % 34) + '%', backgroundColor: colorFor(book), boxShadow: 'inset 3px 0 0 #ffffff25, inset -3px 0 0 #00000018' }}>
                <div className="h-[70%] my-2 mx-auto w-[2px] bg-white/40" />
              </div>)}
              {!items.length && <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-2 pb-5"><LibraryBig size={36} strokeWidth={1.3} /><span className="text-xs">Regál je zatím prázdný</span></div>}
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#a27c58] shadow-md" />
            </div>
            <div className="px-5 pb-5 text-sm text-emerald-800 font-semibold flex items-center justify-between">Otevřít regál <span className="group-hover:translate-x-1 transition-transform">→</span></div>
          </button>;
        })}
      </div>
    </> : <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setActiveShelf(null)} className="flex items-center gap-2 text-emerald-900 font-semibold hover:underline"><ArrowLeft size={18}/> Všechny regály</button>
        <span className="text-sm text-stone-500">{visibleBooks.length} záznamů</span>
      </div>
      <div className="rounded-3xl bg-white border border-stone-200 p-5 md:p-7 shadow-sm">
        <div className="flex gap-4 items-center mb-5"><div className="bg-[#e7efe8] p-4 rounded-2xl text-emerald-800"><LibraryBig size={28}/></div><div><p className="text-sm text-stone-500">Právě prohlížíte regál</p><h2 className="text-3xl font-bold text-[#25473f]">{currentShelf || 'Nezařazené knihy'}</h2></div></div>
        <div className="grid md:grid-cols-[1fr_220px] gap-3 mb-7">
          <label className="relative"><Search size={18} className="absolute left-3 top-3.5 text-stone-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Najít knihu v regálu…" className="w-full rounded-xl border border-stone-200 p-3 pl-10 focus:ring-2 focus:ring-emerald-600 focus:outline-none"/></label>
          <select aria-label="Sekce v regálu" className="rounded-xl border border-stone-200 p-3 bg-white" value={section} onChange={e=>setSection(e.target.value)}><option value="all">Všechny sekce</option>{sections.map(s=><option key={s} value={s}>{s}</option>)}</select>
        </div>
        {!visibleBooks.length ? <p className="text-stone-500 text-center py-12">V regálu nejsou žádné odpovídající knihy.</p> :
          <div className="grid md:grid-cols-2 gap-3">
            {visibleBooks.map(book => <article key={book.id} className="rounded-2xl border border-stone-200 p-4 flex gap-4 items-center bg-[#fcfbf8]">
              {book.coverUrl ? <img src={book.coverUrl} alt="" className="h-24 w-16 object-cover rounded-md shadow-sm" onError={e=>{e.currentTarget.style.display='none';}}/> : <div className="h-24 w-16 shrink-0 rounded-md flex items-center justify-center text-white" style={{backgroundColor:colorFor(book)}}><BookOpen size={25}/></div>}
              <div className="min-w-0 flex-1"><h3 className="font-semibold text-[#243d35] leading-tight">{book.title}</h3><p className="text-xs text-stone-500 mt-1">{book.authors || 'Autor neuveden'}</p><span className={'inline-block mt-2 text-xs font-semibold rounded-full px-2 py-1 ' + (book.status==='borrowed'?'bg-amber-100 text-amber-900':'bg-emerald-100 text-emerald-900')}>{book.status==='borrowed'?'Vypůjčeno':'Dostupné'}</span>
                <div className="mt-3 flex flex-wrap items-center gap-2"><button className="text-sm font-semibold text-emerald-800 hover:underline" onClick={()=>onEditBook(book)}>Upravit</button><label className="flex items-center gap-1 text-xs text-stone-500"><ArrowRightLeft size={14}/><span className="sr-only">Přesunout do regálu</span><select aria-label={'Přesunout knihu ' + book.title} value={book.shelf||''} onChange={e=>onMoveBook(book.id,e.target.value)} className="max-w-32 rounded-md border border-stone-200 bg-white py-1 px-1 text-stone-800"><option value="">Nezařazeno</option>{shelves.map(name=><option key={name} value={name}>{name}</option>)}</select></label></div>
              </div>
            </article>)}
          </div>}
      </div>
    </>}
  </section>;
}
