import React, { useState, useMemo } from 'react';
import { Search, Library, BookOpen, CheckCircle2, Bookmark, LayoutGrid, List, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { BookCard } from './BookCard';

const STATUSES = ['all', 'Chci si přečíst', 'Právě čtu', 'Přečteno'];

export function LibraryView({ books, onViewBook, onDeleteBook }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [layout, setLayout] = useState('grid');

  const genres = useMemo(() => [...new Set(books.flatMap(b => typeof b.genre === 'string' ? b.genre.split(',').map(g => g.trim()).filter(Boolean) : []))].sort((a,b) => a.localeCompare(b, 'cs')), [books]);
  const counts = useMemo(() => ({
    all: books.length,
    'Chci si přečíst': books.filter(b => !b.status || b.status === 'Chci si přečíst').length,
    'Právě čtu': books.filter(b => b.status === 'Právě čtu').length,
    'Přečteno': books.filter(b => b.status === 'Přečteno').length
  }), [books]);
  const progress = books.length ? Math.round(counts['Přečteno'] / books.length * 100) : 0;

  const filteredBooks = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('cs');
    return books.filter(book => {
      const searchable = [book.title, book.authors, book.isbn, book.genre].filter(Boolean).join(' ').toLocaleLowerCase('cs');
      return (!term || searchable.includes(term))
        && (selectedGenre === 'all' || (book.genre || '').toLocaleLowerCase('cs').split(',').map(s => s.trim()).includes(selectedGenre.toLocaleLowerCase('cs')))
        && (selectedStatus === 'all' || (book.status || 'Chci si přečíst') === selectedStatus);
    }).sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'author') return (a.authors || '').localeCompare(b.authors || '', 'cs');
      if (sortBy === 'recent') return (b.addedAt || '').localeCompare(a.addedAt || '');
      return (a.title || '').localeCompare(b.title || '', 'cs');
    });
  }, [books, searchTerm, selectedGenre, selectedStatus, sortBy]);
  const clearFilters = () => { setSearchTerm(''); setSelectedGenre('all'); setSelectedStatus('all'); setSortBy('title'); };
  const filtered = Boolean(searchTerm || selectedGenre !== 'all' || selectedStatus !== 'all');
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-emerald-950 text-white p-6 sm:p-9 shadow-lg">
        <div className="absolute -right-12 -top-14 w-64 h-64 rounded-full bg-emerald-600/20 blur-2xl pointer-events-none" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-[0.2em]"><Sparkles className="w-4 h-4" /> Váš čtenářský svět</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mt-3">Příběhy, ke kterým se vracíte.</h2>
          <p className="text-emerald-100/80 mt-3 text-sm max-w-xl">Mějte své knihy na jednom místě, sledujte čtenářské cíle a objevujte další příběhy.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
            {[
              { label: 'V knihovně', value: counts.all, icon: Library },
              { label: 'Přečteno', value: counts['Přečteno'], icon: CheckCircle2 },
              { label: 'Právě čtu', value: counts['Právě čtu'], icon: BookOpen },
              { label: 'Chci přečíst', value: counts['Chci si přečíst'], icon: Bookmark }
            ].map(({ label, value, icon: Icon }) => <div key={label} className="bg-white/10 border border-white/10 rounded-2xl p-3 sm:p-4"><Icon className="w-4 h-4 text-emerald-200" /><strong className="block text-2xl font-serif mt-2">{value}</strong><span className="text-[11px] text-emerald-100/80">{label}</span></div>)}
          </div>
          <div className="mt-6 flex gap-4 items-center"><div className="h-2 rounded-full flex-1 bg-white/15 overflow-hidden" role="progressbar" aria-label="Podíl přečtených knih" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-amber-300 rounded-full transition-all" style={{width: `${progress}%`}} /></div><span className="text-xs font-semibold text-emerald-100 whitespace-nowrap">{progress} % přečteno</span></div>
        </div>
      </div>
      <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1"><Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-800" /><input aria-label="Hledat knihy" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Hledat název, autora, žánr nebo ISBN…" className="w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" /></div>
          <div className="flex items-center p-1 bg-stone-100 rounded-2xl self-start" aria-label="Zobrazení knih">
            <button type="button" onClick={() => setLayout('grid')} aria-label="Mřížka" aria-pressed={layout === 'grid'} className={`p-2.5 rounded-xl cursor-pointer ${layout === 'grid' ? 'bg-white shadow-sm text-emerald-900' : 'text-stone-500'}`}><LayoutGrid className="w-5 h-5" /></button>
            <button type="button" onClick={() => setLayout('list')} aria-label="Seznam" aria-pressed={layout === 'list'} className={`p-2.5 rounded-xl cursor-pointer ${layout === 'list' ? 'bg-white shadow-sm text-emerald-900' : 'text-stone-500'}`}><List className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(status => <button key={status} type="button" onClick={() => setSelectedStatus(status)} aria-pressed={selectedStatus === status} className={`px-3 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${selectedStatus === status ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-emerald-300'}`}>{status === 'all' ? 'Všechny knihy' : status} <span className="opacity-75 ml-1">{counts[status]}</span></button>)}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal className="w-4 h-4 text-stone-500 hidden sm:block" />
          <label className="sr-only" htmlFor="genre-filter">Žánr</label>
          <select id="genre-filter" value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs sm:text-sm min-w-0 max-w-[48%]"><option value="all">Všechny žánry</option>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select>
          <label className="sr-only" htmlFor="sort-books">Řazení</label>
          <select id="sort-books" value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs sm:text-sm min-w-0 max-w-[48%]"><option value="title">Podle názvu</option><option value="author">Podle autora</option><option value="rating">Nejlépe hodnocené</option></select>
          {filtered && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:underline cursor-pointer ml-auto"><X className="w-3.5 h-3.5" />Vymazat filtry</button>}
        </div>
        <p className="text-xs text-stone-500" aria-live="polite">Zobrazeno {filteredBooks.length} z {books.length} knih</p>
      </div>
      {filteredBooks.length ? <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'grid grid-cols-1 gap-4'}>{filteredBooks.map((book, index) => <BookCard key={book.isbn || `${book.title}-${index}`} book={book} onView={onViewBook} onDelete={onDeleteBook} layout={layout} />)}</div> : <div className="text-center rounded-3xl border border-dashed border-stone-300 bg-white p-10 sm:p-16"><Library className="w-10 h-10 mx-auto text-emerald-700 mb-4" /><h3 className="font-serif font-bold text-xl">{books.length ? 'Žádná kniha neodpovídá filtrům' : 'Vaše knihovna čeká na první příběh'}</h3><p className="text-stone-500 text-sm mt-2">{books.length ? 'Zkuste jiné vyhledávání nebo zrušte filtry.' : 'Naskenujte ISBN nebo knihu přidejte přes tlačítko v horní části stránky.'}</p>{filtered && <button type="button" onClick={clearFilters} className="mt-4 bg-emerald-800 text-white rounded-xl px-4 py-2 cursor-pointer">Zobrazit všechny knihy</button>}</div>}
    </section>
  );
}
