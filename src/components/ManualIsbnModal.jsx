import React, { useState } from 'react';
import { X, Hash, Search } from 'lucide-react';

export function ManualIsbnModal({ isOpen, onClose, onSubmitIsbn }) {
  const [isbnInput, setIsbnInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = isbnInput.replace(/[^0-9X]/gi, '');
    if (!clean) {
      setError('Zadejte prosím číslo ISBN.');
      return;
    }
    if (clean.length !== 10 && clean.length !== 13) {
      setError('ISBN musí mít 10 nebo 13 číslic.');
      return;
    }
    setError('');
    onSubmitIsbn(clean);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-amber-200/50 text-stone-500 hover:text-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-amber-200/80 text-amber-950 rounded-xl">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Ruční zadání ISBN</h3>
            <p className="text-xs text-stone-600">Napište 10 nebo 13-místný ISBN kód knihy</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Kód ISBN
            </label>
            <input
              type="text"
              value={isbnInput}
              onChange={(e) => {
                setIsbnInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="např. 9788020712219 nebo 978-80-207-1221-9"
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-stone-900 text-sm font-mono placeholder:text-stone-400 placeholder:font-sans"
              autoFocus
            />
            {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-stone-600 hover:bg-amber-100 transition cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-amber-950 font-medium text-sm transition shadow-xs cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Vyhledat knihu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
