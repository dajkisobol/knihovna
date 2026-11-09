import React from 'react';
import { Star, Trash2, Eye, BookOpen } from 'lucide-react';
import { BookCover } from './BookCover';

const states = {
  'Přečteno': 'bg-emerald-100 text-emerald-900',
  'Právě čtu': 'bg-amber-100 text-amber-900',
  'Chci si přečíst': 'bg-stone-100 text-stone-700'
};

export function BookCard({ book, onView, onDelete, layout = 'grid' }) {
  const list = layout === 'list';
  return (
    <article className={`group relative overflow-hidden rounded-3xl bg-white border border-stone-200/80 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${list ? 'flex items-stretch' : 'flex flex-col'}`}>
      <button type="button" onClick={() => onView(book)} className={`relative block overflow-hidden bg-[#ede8dc] cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-700 ${list ? 'w-28 sm:w-40 shrink-0 min-h-44' : 'w-full h-56 sm:h-64'}`} aria-label={`Zobrazit knihu ${book.title}`}>
        <BookCover book={book} className="absolute inset-0 w-full h-full" />
        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${states[book.status] || states['Chci si přečíst']}`}>{book.status || 'Chci si přečíst'}</span>
      </button>
      <div className="flex flex-col flex-1 min-w-0 p-4 sm:p-5">
        <div className="flex-1">
          {book.genre && <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 line-clamp-1 mb-1">{book.genre}</p>}
          <button type="button" onClick={() => onView(book)} className="text-left cursor-pointer group-hover:text-emerald-800 transition-colors">
            <h3 className="text-lg font-serif font-bold text-stone-900 leading-tight line-clamp-2">{book.title || 'Bez názvu'}</h3>
          </button>
          <p className="text-sm text-stone-500 mt-1 line-clamp-1">{book.authors || 'Neznámý autor'}</p>
          <p className={`text-xs text-stone-600 leading-relaxed mt-3 line-clamp-2 ${list ? '' : 'min-h-9'}`}>{book.description || 'Objevte tuto knihu ve své knihovně.'}</p>
          <div className="flex items-center gap-1 mt-3" aria-label={book.rating ? `Hodnocení ${book.rating} z 5` : 'Zatím bez hodnocení'}>
            {[1,2,3,4,5].map(star => <Star key={star} className={`w-4 h-4 ${star <= (book.rating || 0) ? 'fill-amber-400 text-amber-500' : 'text-stone-200'}`} />)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <span className="text-xs text-stone-400 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{book.pageCount ? `${book.pageCount} stran` : 'Knižní detail'}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onDelete(book.isbn)} title="Odstranit knihu" aria-label={`Odstranit ${book.title}`} className="p-2 rounded-xl text-stone-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            <button type="button" onClick={() => onView(book)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-semibold transition cursor-pointer"><Eye className="w-4 h-4" />Detail</button>
          </div>
        </div>
      </div>
    </article>
  );
}
