import React from 'react';
import { BookOpen, Star, Trash2, Eye } from 'lucide-react';

export function BookCard({ book, onView, onDelete }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Přečteno':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Právě čtu':
        return 'bg-amber-200 text-amber-900 border-amber-300';
      case 'Chci si přečíst':
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="bg-amber-100/40 hover:bg-amber-100/70 border border-amber-200/80 rounded-2xl p-4 transition duration-200 shadow-xs hover:shadow-md flex flex-col justify-between group relative">
      <div>
        {/* Cover & Badge row */}
        <div className="flex gap-3.5 items-start mb-3">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-lg shadow-xs border border-amber-200 shrink-0 group-hover:scale-102 transition duration-200"
            />
          ) : (
            <div className="w-20 h-28 bg-amber-200/50 rounded-lg border border-amber-300/70 flex flex-col items-center justify-center text-amber-800 shrink-0">
              <BookOpen className="w-7 h-7 opacity-50 mb-1" />
              <span className="text-[10px] text-center font-medium px-1 leading-tight">Bez obálky</span>
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(book.status)}`}>
                {book.status || 'Chci si přečíst'}
              </span>
              {book.genre && (
                <span className="text-[10px] text-stone-500 truncate max-w-[100px]" title={book.genre}>
                  {book.genre}
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-stone-900 leading-snug line-clamp-2 group-hover:text-amber-950 transition">
              {book.title}
            </h3>

            <p className="text-xs font-medium text-amber-900/80 truncate">
              {book.authors}
            </p>

            {/* Rating Stars */}
            <div className="flex items-center space-x-0.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= (book.rating || 0)
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Short Summary Preview */}
        <p className="text-xs text-stone-600 line-clamp-3 mb-3 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-amber-200/50">
          {book.description || 'Popis knihy není k dispozici.'}
        </p>
      </div>

      {/* Card Actions */}
      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
        <span className="text-[11px] font-mono text-stone-500">
          {book.isbn ? `ISBN: ${book.isbn}` : ''}
        </span>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onDelete(book.isbn)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            title="Odstranit knihu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onView(book)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-medium transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detail</span>
          </button>
        </div>
      </div>
    </div>
  );
}
