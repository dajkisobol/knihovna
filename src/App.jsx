import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ManualIsbnModal } from './components/ManualIsbnModal';
import { BookDetailModal } from './components/BookDetailModal';
import { LibraryView } from './components/LibraryView';
import { fetchBookByIsbn, enrichBookWithOpenAI } from './services/bookService';
import { getSavedBooks, saveBooks, getSettings, saveSettings } from './utils/storage';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState([]);
  const [settings, setSettings] = useState({ openAiKey: '' });

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Loading & error state
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load stored data on mount
  useEffect(() => {
    setBooks(getSavedBooks());
    setSettings(getSettings());
  }, []);

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

      // Fetch book info from Google / Open Library
      let fetchedBook = await fetchBookByIsbn(isbn);

      // Auto-enrich with OpenAI if API key exists
      if (settings.openAiKey) {
        try {
          fetchedBook = await enrichBookWithOpenAI(fetchedBook, settings.openAiKey);
        } catch (aiErr) {
          console.warn('OpenAI enrichment error on scan:', aiErr);
        }
      }

      setSelectedBook(fetchedBook);
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Error fetching ISBN:', err);
      setErrorMessage(err.message || 'Nepodařilo se načíst informace o knize.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual AI enrichment button click inside modal
  const handleEnrichWithAi = async (bookToEnrich) => {
    if (!settings.openAiKey) {
      alert('Pro rozšíření pomocí AI vložte v nastavení (ikona klíče v záhlaví) váš OpenAI API klíč.');
      return;
    }

    setIsAiLoading(true);
    try {
      const enriched = await enrichBookWithOpenAI(bookToEnrich, settings.openAiKey);
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-amber-50/40 to-stone-100 flex flex-col font-sans text-stone-800">
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
      />

      {/* Main Body */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 flex-1">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-amber-100/90 border border-amber-300 text-amber-950 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-800 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-amber-800 hover:text-amber-950 text-xs font-semibold underline px-2 py-1"
            >
              Zavřít
            </button>
          </div>
        )}

        {/* Global Loading overlay indicator */}
        {isLoading && (
          <div className="mb-6 p-5 bg-amber-100/60 border border-amber-200 rounded-2xl flex items-center justify-center space-x-3 text-amber-950 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Vyhledávám knihu podle ISBN...</span>
          </div>
        )}

        {/* Library view with books list */}
        <LibraryView
          books={books}
          onViewBook={(book) => {
            setSelectedBook(book);
            setIsDetailOpen(true);
          }}
          onDeleteBook={handleDeleteBook}
        />
      </main>

      {/* Modals */}
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
      />

      {/* Footer */}
      <footer className="border-t border-amber-200/60 bg-amber-100/30 py-4 mt-8 text-center text-xs text-stone-500">
        <p>Moje Knihovna &copy; {new Date().getFullYear()} — Vytvořeno v jemném žlutém designu pro pohodlné skenování knih</p>
      </footer>
    </div>
  );
}
