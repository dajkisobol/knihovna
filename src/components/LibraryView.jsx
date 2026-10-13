import React, { useState, useMemo } from 'react';
import { Search, Library } from 'lucide-react';
import { BookCard } from './BookCard';

export function LibraryView({ books, onViewBook, onDeleteBook }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title'); // 'title' | 'author' | 'rating'

  // Unique genres
  const genres = useMemo(() => {
    const set = new Set();
    books.forEach((b) => {
      if (b.genre) {
        b.genre.split(',').forEach((g) => set.add(g.trim()));
      }
    });
    return Array.from(set);
  }, [books]);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        const matchesSearch =
          book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.authors?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.isbn?.includes(searchTerm);

        const matchesGenre =
          selectedGenre === 'all' ||
          (book.genre && book.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

        const matchesStatus =
          selectedStatus === 'all' || book.status === selectedStatus;

        return matchesSearch && matchesGenre && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'author') {
          return (a.authors || '').localeCompare(b.authors || '');
        }
        return (a.title || '').localeCompare(b.title || '');
      });
  }, [books, searchTerm, selectedGenre, selectedStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-amber-100/50 border border-amber-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-amber-800/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat podle názvu, autora nebo ISBN..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-300/80 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-stone-400"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-amber-300/80 bg-white text-stone-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="all">Všechny stavy</option>
              <option value="Chci si přečíst">Chci si přečíst</option>
              <option value="Právě čtu">Právě čtu</option>
              <option value="Přečteno">Přečteno</option>
            </select>

            {/* Genre Filter */}
            {genres.length > 0 && (
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-amber-300/80 bg-white text-stone-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Všechny žánry</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-amber-300/80 bg-white text-stone-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="title">Řadit: Název</option>
              <option value="author">Řadit: Autor</option>
              <option value="rating">Řadit: Hodnocení</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Books */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.isbn}
              book={book}
              onView={onViewBook}
              onDelete={onDeleteBook}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-amber-100/30 rounded-2xl border border-dashed border-amber-300/80 space-y-3">
          <div className="w-16 h-16 bg-amber-200/60 text-amber-900 rounded-full flex items-center justify-center mx-auto">
            <Library className="w-8 h-8 opacity-70" />
          </div>
          {books.length === 0 ? (
            <div>
              <h3 className="text-lg font-bold text-stone-900">Vaše knihovna je zatím prázdná</h3>
              <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                Začněte naskenováním čárového kódu na knize pomocí tlačítka "Naskenovat čárový kód" nebo zadejte ISBN kód ručně.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-stone-900">Nenalezeny žádné odpovídající knihy</h3>
              <p className="text-xs text-stone-600 mt-1">
                Zkuste změnit hledaný výraz nebo vyresetovat filtry.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
