import React from 'react';
import { History, Trash2, BookOpen, Clock, ArrowRight } from 'lucide-react';

export function HistoryView({ history, onViewBook, onClearHistory }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-amber-100/30 rounded-2xl border border-dashed border-amber-300/80 space-y-3">
        <div className="w-16 h-16 bg-amber-200/60 text-amber-900 rounded-full flex items-center justify-center mx-auto">
          <History className="w-8 h-8 opacity-70" />
        </div>
        <h3 className="text-lg font-bold text-stone-900">Zatím nemáte žádnou historii prohlížení</h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          Zde se budou přehledně zobrazovat knihy, které jste si v aplikaci prohlíželi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-amber-100/60 border border-amber-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-300 text-amber-950 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 leading-tight">
              Nedávno prohlížené knihy ({history.length})
            </h2>
            <p className="text-xs text-stone-600">
              Historie vašich vyhledaných a prohlížených titulů
            </p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-stone-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold transition cursor-pointer border border-stone-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Vymazat historii</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item, idx) => (
          <div
            key={item.isbn + '-' + idx}
            className="bg-white/80 hover:bg-amber-100/50 border border-amber-200 rounded-2xl p-3.5 transition flex items-center justify-between gap-3 shadow-xs group"
          >
            <div className="flex items-center space-x-3 min-w-0">
              {item.coverUrl ? (
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  className="w-12 h-16 object-cover rounded-lg border border-amber-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-16 bg-amber-200/50 rounded-lg border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                  <BookOpen className="w-5 h-5 opacity-50" />
                </div>
              )}

              <div className="min-w-0 space-y-0.5">
                <h4 className="text-xs font-bold text-stone-900 truncate leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-amber-900/80 truncate">
                  {item.authors}
                </p>
                <p className="text-[10px] text-stone-400 font-mono">
                  {item.viewedAt ? new Date(item.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => onViewBook(item)}
              className="p-2 rounded-xl bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition cursor-pointer shrink-0"
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
