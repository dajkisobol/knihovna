import React, { useState } from 'react';
import { X, Key, Save, Check, Bot } from 'lucide-react';

export function Header({
  onOpenScanner,
  onOpenManual,
  openAiKey,
  onSaveSettings,
  activeProfile,
  onOpenProfile,
  activeTab,
  onSelectTab,
  onOpenAiChat
}) {
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
    <header className="bg-emerald-900/90 text-stone-100 border-b border-emerald-800/80 sticky top-0 z-30 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Brand logo & title */}
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-800/90 text-emerald-100 p-2.5 rounded-xl shadow-xs font-bold text-xl flex items-center justify-center border border-emerald-700/60">
            🌿
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-50 tracking-tight leading-none">
              Moje Knihovna
            </h1>
            <p className="text-xs text-emerald-200/80 mt-0.5 font-medium">
              Skenování ISBN & Šalvějový literární asistent
            </p>
          </div>
        </div>

        {/* Action buttons and Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* AI Chatbot Header button */}
          <button
            onClick={onOpenAiChat}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-stone-100 text-xs font-semibold transition border border-emerald-600/80 shadow-xs cursor-pointer active:scale-95"
            title="Otevřít AI knižního chatbota"
          >
            <Bot className="w-4 h-4 text-emerald-200" />
            <span className="hidden md:inline">AI Chatbot</span>
          </button>

          {/* Active User Profile Button */}
          <button
            onClick={onOpenProfile}
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-stone-100 text-xs font-bold transition border border-emerald-700/80 shadow-xs cursor-pointer"
          >
            <span className="text-base">{activeProfile?.avatar || '👤'}</span>
            <span className="hidden sm:inline truncate max-w-[100px]">
              {activeProfile?.name || 'Profil'}
            </span>
          </button>

          <button
            onClick={onOpenScanner}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-50 font-medium text-sm transition shadow-xs cursor-pointer active:scale-95 border border-emerald-500/50"
          >
            <span>📷</span>
            <span className="hidden sm:inline">Naskenovat čárový kód</span>
            <span className="sm:hidden">Skenovat</span>
          </button>

          <button
            onClick={onOpenManual}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-950 text-emerald-100 font-medium text-sm transition border border-emerald-700/60 cursor-pointer active:scale-95"
          >
            <span>⌨️</span>
            <span className="hidden sm:inline">Zadat ISBN ručně</span>
            <span className="sm:hidden">ISBN</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            title="Nastavení OpenAI API klíče"
            className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-800 text-emerald-200 transition border border-emerald-700/60 cursor-pointer"
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* App Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center space-x-1 sm:space-x-2 pt-1 border-t border-emerald-800/60">
        {[
          { id: 'library', label: 'Moje Knihovna', icon: '📚' },
          { id: 'community', label: 'Veřejný prostor & Komunita', icon: '💬' },
          { id: 'history', label: 'Historie prohlížení', icon: '🕒' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`px-3.5 py-2 font-semibold text-xs sm:text-sm rounded-t-xl transition cursor-pointer flex items-center space-x-1.5 border-b-2 ${
              activeTab === tab.id
                ? 'bg-[#fbf9f5] text-emerald-950 border-emerald-600 shadow-xs'
                : 'text-emerald-100/80 hover:text-white hover:bg-emerald-800/50 border-transparent'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] text-stone-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-emerald-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-emerald-100 text-stone-500 hover:text-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-emerald-950">Nastavení OpenAI API</h3>
                <p className="text-xs text-stone-600">Volitelné pro chytrého AI chatbota a podrobné rozbory</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  OpenAI API Key (sk-...)
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm text-stone-800"
                />
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  Klíč se ukládá bezpečně výhradně ve vašem prohlížeči. Je použit pro AI chatbota i detailní rozbory v knihovně.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-stone-600 hover:bg-stone-200/60 transition cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition shadow-xs cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
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
