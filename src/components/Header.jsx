import React, { useState } from 'react';
import { X, Key, Save, Check } from 'lucide-react';

export function Header({ onOpenScanner, onOpenManual, openAiKey, onSaveSettings }) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [keyInput, setKeyInput] = useState(openAiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowSettingsModal(false);
    }, 1200);
  };

  return (
    <header className="bg-amber-100/70 border-b border-amber-200/80 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Brand logo & title */}
        <div className="flex items-center space-x-3">
          <div className="bg-amber-400/90 text-amber-950 p-2.5 rounded-xl shadow-xs font-bold text-xl flex items-center justify-center">
            📚
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight leading-none">
              Moje Knihovna
            </h1>
            <p className="text-xs text-amber-800/80 mt-0.5 font-medium">
              Skenování ISBN & Přehled knih
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-amber-950 font-medium text-sm transition shadow-xs cursor-pointer active:scale-95"
          >
            <span>📷</span>
            <span className="hidden sm:inline">Naskenovat čárový kód</span>
            <span className="sm:hidden">Skenovat</span>
          </button>

          <button
            onClick={onOpenManual}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-medium text-sm transition border border-stone-200 cursor-pointer active:scale-95"
          >
            <span>⌨️</span>
            <span className="hidden sm:inline">Zadat ISBN ručně</span>
            <span className="sm:hidden">ISBN</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            title="Nastavení OpenAI API klíče"
            className="p-2 rounded-lg bg-stone-100 hover:bg-amber-200/60 text-stone-700 transition border border-stone-200 cursor-pointer"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-amber-50 rounded-2xl max-w-md w-full p-6 shadow-xl border border-amber-200/80 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-amber-200/50 text-stone-500 hover:text-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-amber-200/80 text-amber-900 rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Nastavení OpenAI API</h3>
                <p className="text-xs text-stone-600">Volitelné pro detailnější rozbory a české myšlenky</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  OpenAI API Key (sk-...)
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-sm text-stone-800"
                />
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  Klíč se ukládá výhradně lokálně ve vašem prohlížeči. Bez klíče se pro shrnutí a myšlenky používají bezplatná knihovní data.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-stone-600 hover:bg-amber-100 transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-amber-950 text-sm font-medium transition shadow-xs"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-800" />
                      <span>Uloženo!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Uložit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
