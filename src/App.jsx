import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ManualIsbnModal } from './components/ManualIsbnModal';
import { BookDetailModal } from './components/BookDetailModal';
import { LibraryView } from './components/LibraryView';
import { HistoryView } from './components/HistoryView';
import { ProfileModal } from './components/ProfileModal';
import { AiChatModal } from './components/AiChatModal';
import { fetchBookByIsbn, enrichBookWithOpenAI } from './services/bookService';
import {
  getSavedBooks,
  saveBooks,
  getSettings,
  saveSettings,
  getProfiles,
  saveProfiles,
  getActiveProfile,
  saveActiveProfile,
  getBrowsingHistory,
  addBrowsingHistory,
  clearBrowsingHistory
} from './utils/storage';
import { Loader2, AlertCircle, Bot } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState([]);
  const [settings, setSettings] = useState({ openAiKey: '' });

  // Profiles & Navigation State
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'history'
  const [browsingHistory, setBrowsingHistory] = useState([]);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // AI Chatbot State
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [bookToDiscuss, setBookToDiscuss] = useState(null);

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load stored data on mount
  useEffect(() => {
    setBooks(getSavedBooks());
    setSettings(getSettings());
    const profs = getProfiles();
    setProfiles(profs);
    setActiveProfile(getActiveProfile());
    setBrowsingHistory(getBrowsingHistory());
  }, []);

  const handleOpenBookDetail = (book) => {
    setSelectedBook(book);
    setIsDetailOpen(true);
    const updatedHistory = addBrowsingHistory(book);
    setBrowsingHistory(updatedHistory);
  };

  const handleOpenBookConsultation = (book) => {
    setBookToDiscuss(book);
    setIsDetailOpen(false);
    setIsAiChatOpen(true);
  };

  const handleSwitchProfile = (prof) => {
    setActiveProfile(prof);
    saveActiveProfile(prof);
    setIsProfileModalOpen(false);
  };

  const handleCreateProfile = (newProf) => {
    const updated = [...profiles, newProf];
    setProfiles(updated);
    saveProfiles(updated);
    handleSwitchProfile(newProf);
  };

  const handleClearHistory = () => {
    if (window.confirm('Opravdu chcete vymazat historii prohlížení?')) {
      clearBrowsingHistory();
      setBrowsingHistory([]);
    }
  };

  const handleSaveSettings = (newKey) => {
    const updated = { ...settings, openAiKey: newKey };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleUpdateBooks = (newBooks) => {
    setBooks(newBooks);
    saveBooks(newBooks);
  };

  // Process newly scanned or entered ISBN
  const handleProcessIsbn = async (isbn) => {
    setIsScannerOpen(false);
    setIsManualOpen(false);
    setErrorMessage('');
    setIsLoading(true);

    try {
      // Check if book is already in library
      const existing = books.find((b) => b.isbn === isbn);
      if (existing) {
        setSelectedBook(existing);
        setIsDetailOpen(true);
        setIsLoading(false);
        return;
      }

      // Fetch book info from Knihovny.cz / Google / Open Library
      let fetchedBook = await fetchBookByIsbn(isbn);

      // Auto-enrich with OpenAI if API key exists
      if (settings.openAiKey) {
        try {
          fetchedBook = await enrichBookWithOpenAI(fetchedBook, settings.openAiKey);
        } catch (aiErr) {
          console.warn('OpenAI enrichment error on scan:', aiErr);
        }
      }

      handleOpenBookDetail(fetchedBook);
    } catch (err) {
      console.error('Error fetching ISBN:', err);
      setErrorMessage(err.message || 'Nepodařilo se načíst informace o knize.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual AI enrichment button click inside modal
  const handleEnrichWithAi = async (bookToEnrich, customPrompt = '') => {
    if (!settings.openAiKey) {
      alert('Pro rozšíření pomocí AI vložte v nastavení (ikona klíče v záhlaví) váš OpenAI API klíč.');
      return;
    }

    setIsAiLoading(true);
    try {
      const enriched = await enrichBookWithOpenAI(bookToEnrich, settings.openAiKey, customPrompt);
      setSelectedBook(enriched);
      // If already in library, save changes automatically
      if (books.some((b) => b.isbn === enriched.isbn)) {
        const updatedList = books.map((b) => (b.isbn === enriched.isbn ? enriched : b));
        handleUpdateBooks(updatedList);
      }
    } catch (err) {
      alert(`Chyba při komunikaci s OpenAI: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save or update book in user's library
  const handleSaveBookToLibrary = (bookToSave) => {
    const existsIndex = books.findIndex((b) => b.isbn === bookToSave.isbn);
    let updated;
    if (existsIndex >= 0) {
      updated = [...books];
      updated[existsIndex] = bookToSave;
    } else {
      updated = [bookToSave, ...books];
    }
    handleUpdateBooks(updated);
    setIsDetailOpen(false);
  };

  // Delete book from user's library
  const handleDeleteBook = (isbn) => {
    if (window.confirm('Opravdu chcete tuto knihu odstranit ze své knihovny?')) {
      const updated = books.filter((b) => b.isbn !== isbn);
      handleUpdateBooks(updated);
      if (selectedBook?.isbn === isbn) {
        setIsDetailOpen(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans text-stone-800 relative">
      {/* Header */}
      <Header
        onOpenScanner={() => {
          setErrorMessage('');
          setIsScannerOpen(true);
        }}
        onOpenManual={() => {
          setErrorMessage('');
          setIsManualOpen(true);
        }}
        openAiKey={settings.openAiKey}
        onSaveSettings={handleSaveSettings}
        activeProfile={activeProfile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAiChat={() => {
          setBookToDiscuss(null);
          setIsAiChatOpen(true);
        }}
      />

      {/* Main Body */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 flex-1">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-800 hover:text-red-950 text-xs font-semibold underline px-2 py-1"
            >
              Zavřít
            </button>
          </div>
        )}

        {/* Global Loading overlay indicator */}
        {isLoading && (
          <div className="mb-6 p-5 bg-emerald-100/70 border border-emerald-200 rounded-2xl flex items-center justify-center space-x-3 text-emerald-950 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-800" />
            <span className="text-sm font-medium">Vyhledávám knihu podle ISBN...</span>
          </div>
        )}

        {/* Views based on Active Tab */}
        {activeTab === 'library' && (
          <LibraryView
            books={books}
            onViewBook={handleOpenBookDetail}
            onDeleteBook={handleDeleteBook}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={browsingHistory}
            onViewBook={handleOpenBookDetail}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Floating AI Chatbot Action Button */}
      <button
        onClick={() => {
          setBookToDiscuss(null);
          setIsAiChatOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 p-3.5 sm:px-4 sm:py-3.5 bg-emerald-800 hover:bg-emerald-700 text-stone-50 rounded-2xl shadow-xl flex items-center space-x-2.5 transition transform hover:scale-105 active:scale-95 border border-emerald-600/80 cursor-pointer"
        title="Otevřít AI knižního asistenta"
      >
        <Bot className="w-6 h-6 text-emerald-200" />
        <span className="hidden sm:inline text-xs font-bold font-serif">AI Knižní Asistent</span>
      </button>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        onSwitchProfile={handleSwitchProfile}
        onCreateProfile={handleCreateProfile}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleProcessIsbn}
      />

      <ManualIsbnModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onSubmitIsbn={handleProcessIsbn}
      />

      <BookDetailModal
        book={selectedBook}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSave={handleSaveBookToLibrary}
        isAlreadyInLibrary={books.some((b) => b?.isbn === selectedBook?.isbn)}
        onEnrichAi={handleEnrichWithAi}
        isAiLoading={isAiLoading}
        onOpenConsultation={handleOpenBookConsultation}
      />

      <AiChatModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        openAiKey={settings.openAiKey}
        onOpenSettings={() => {
          setIsAiChatOpen(false);
          // show settings modal by calling key button or similar
        }}
        books={books}
        browsingHistory={browsingHistory}
        initialBookToDiscuss={bookToDiscuss}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-100/60 py-4 mt-8 text-center text-xs text-stone-500">
        <p>Moje Knihovna &copy; {new Date().getFullYear()} — Vytvořeno v elegantním šalvějovém designu s chytrým AI knižním asistentem</p>
      </footer>
    </div>
  );
}
