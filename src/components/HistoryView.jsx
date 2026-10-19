import React from 'react';
import { History, Trash2, BookOpen, Clock, ArrowRight } from 'lucide-react';

export function HistoryView({ history, onViewBook, onClearHistory }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-stone-50/60 rounded-2xl border border-dashed border-stone-300 space-y-3">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-900 rounded-full flex items-center justify-center mx-auto">
          <History className="w-8 h-8 opacity-80" />
        </div>
        <h3 className="text-lg font-serif font-bold text-stone-900">Zatím nemáte žádnou historii prohlížení</h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          Zde se budou přehledně zobrazovat knihy, které jste si v aplikaci prohlíželi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-stone-50/90 border border-emerald-900/10 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-800 text-stone-50 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-stone-900 leading-tight">
              Nedávno prohlížené knihy ({history.length})
            </h2>
            <p className="text-xs text-stone-600">
              Historie vašich vyhledaných a prohlížených titulů
            </p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-stone-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold transition cursor-pointer border border-stone-200 bg-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Vymazat historii</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item, idx) => (
          <div
            key={item.isbn + '-' + idx}
            className="bg-white hover:bg-emerald-50/40 border border-stone-200 hover:border-emerald-300/80 rounded-2xl p-3.5 transition flex items-center justify-between gap-3 shadow-xs group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              {item.coverUrl ? (
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  className="w-12 h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-16 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
                  <BookOpen className="w-5 h-5 opacity-60" />
                </div>
              )}

              <div className="min-w-0 space-y-0.5">
                <h4 className="text-xs font-serif font-bold text-stone-900 truncate leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-emerald-900/80 truncate">
                  {item.authors}
                </p>
                <p className="text-[10px] text-stone-400 font-mono">
                  {item.viewedAt ? new Date(item.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => onViewBook(item)}
              className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 transition cursor-pointer shrink-0 border border-emerald-200"
              title="Zobrazit detail knihy"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
