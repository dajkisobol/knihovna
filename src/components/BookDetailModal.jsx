import React, { useState, useEffect } from 'react';
import { X, Star, Sparkles, Plus, Trash2, Edit3, Check, BookOpen, Tag, Calendar, Building, BookMarked } from 'lucide-react';

export function BookDetailModal({
  book,
  isOpen,
  onClose,
  onSave,
  isAlreadyInLibrary,
  onEnrichAi,
  isAiLoading
}) {
  const [editedBook, setEditedBook] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');

  useEffect(() => {
    if (book) {
      setEditedBook({
        ...book,
        rating: book.rating || 0,
        status: book.status || 'Chci si přečíst', // 'Chci si přečíst' | 'Právě čtu' | 'Přečteno'
        userNotes: book.userNotes || '',
        mainIdeas: Array.isArray(book.mainIdeas) ? [...book.mainIdeas] : []
      });
      setIsEditing(false);
    }
  }, [book]);

  if (!isOpen || !editedBook) return null;

  const handleRatingChange = (newRating) => {
    const updated = { ...editedBook, rating: newRating };
    setEditedBook(updated);
    if (isAlreadyInLibrary) {
      onSave(updated);
    }
  };

  const handleStatusChange = (newStatus) => {
    const updated = { ...editedBook, status: newStatus };
    setEditedBook(updated);
    if (isAlreadyInLibrary) {
      onSave(updated);
    }
  };

  const handleAddIdea = () => {
    if (!newIdeaText.trim()) return;
    const updatedIdeas = [...(editedBook.mainIdeas || []), newIdeaText.trim()];
    const updated = { ...editedBook, mainIdeas: updatedIdeas };
    setEditedBook(updated);
    setNewIdeaText('');
    if (isAlreadyInLibrary) {
      onSave(updated);
    }
  };

  const handleRemoveIdea = (index) => {
    const updatedIdeas = editedBook.mainIdeas.filter((_, i) => i !== index);
    const updated = { ...editedBook, mainIdeas: updatedIdeas };
    setEditedBook(updated);
    if (isAlreadyInLibrary) {
      onSave(updated);
    }
  };

  const handleSaveAll = () => {
    onSave(editedBook);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-amber-50 rounded-2xl max-w-2xl w-full my-auto p-5 sm:p-7 shadow-2xl border border-amber-200 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-amber-200/60 text-stone-500 hover:text-stone-800 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto pr-1 space-y-6 custom-scrollbar">
          {/* Header section with cover & title */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {editedBook.coverUrl ? (
              <img
                src={editedBook.coverUrl}
                alt={editedBook.title}
                className="w-28 sm:w-36 h-40 sm:h-52 object-cover rounded-xl shadow-md border border-amber-200/80 shrink-0 self-center sm:self-start"
              />
            ) : (
              <div className="w-28 sm:w-36 h-40 sm:h-52 bg-amber-200/50 rounded-xl border border-amber-300 flex flex-col items-center justify-center text-amber-800 shrink-0 self-center sm:self-start">
                <BookOpen className="w-10 h-10 opacity-60 mb-2" />
                <span className="text-xs text-center font-medium px-2">Bez obálky</span>
              </div>
            )}

            <div className="flex-1 space-y-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-900 mb-2">
                  {editedBook.genre || 'Obecná literatura'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
                  {editedBook.title}
                </h2>
                <p className="text-sm font-medium text-amber-900/80 mt-1">
                  {editedBook.authors}
                </p>
              </div>

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600 border-y border-amber-200/80 py-2.5">
                {editedBook.isbn && (
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-amber-700" />
                    <span>ISBN: {editedBook.isbn}</span>
                  </div>
                )}
                {editedBook.publisher && (
                  <div className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-amber-700" />
                    <span>{editedBook.publisher}</span>
                  </div>
                )}
                {editedBook.publishedDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>{editedBook.publishedDate}</span>
                  </div>
                )}
                {editedBook.pageCount && (
                  <div className="flex items-center space-x-1">
                    <BookMarked className="w-3.5 h-3.5 text-amber-700" />
                    <span>{editedBook.pageCount} stran</span>
                  </div>
                )}
              </div>

              {/* Status and Rating controls */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                {/* Reading Status */}
                <div className="flex items-center space-x-1 bg-amber-100/80 p-1 rounded-lg border border-amber-200/70 text-xs">
                  {['Chci si přečíst', 'Právě čtu', 'Přečteno'].map((statusOption) => (
                    <button
                      key={statusOption}
                      onClick={() => handleStatusChange(statusOption)}
                      className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                        editedBook.status === statusOption
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-amber-200/50'
                      }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>

                {/* Star Rating */}
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                      title={`${star} hvězdiček`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= (editedBook.rating || 0)
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-stone-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Enrichment Action */}
          <div className="bg-amber-100/60 border border-amber-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-300/80 rounded-lg text-amber-900">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900">Detailnější rozbor myšlenek</p>
                <p className="text-[11px] text-stone-600">
                  {editedBook.aiEnriched
                    ? 'Kniha byla rozšířena o AI analýzu děje'
                    : 'Možnost vygenerovat české shrnutí a hlavní myšlenky'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onEnrichAi(editedBook)}
              disabled={isAiLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-950 text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Generuji...' : 'Rozšířit pomocí AI'}</span>
            </button>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Krátké shrnutí děje
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-amber-800 hover:text-amber-950 flex items-center space-x-1 font-medium cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Upravit text</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                value={editedBook.description}
                onChange={(e) => setEditedBook({ ...editedBook, description: e.target.value })}
                rows={4}
                className="w-full p-3 text-xs sm:text-sm text-stone-800 bg-white rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            ) : (
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-amber-200/60 whitespace-pre-line">
                {editedBook.description || 'Popis knihy není k dispozici.'}
              </p>
            )}
          </div>

          {/* Main Ideas Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Hlavní myšlenky a poselství
            </h3>

            <div className="space-y-2">
              {editedBook.mainIdeas && editedBook.mainIdeas.length > 0 ? (
                editedBook.mainIdeas.map((idea, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between bg-white/70 p-3 rounded-xl border border-amber-200/60 text-xs sm:text-sm text-stone-800 group"
                  >
                    <div className="flex items-start space-x-2.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{idea}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveIdea(idx)}
                      className="text-stone-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Smazat myšlenku"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 italic p-3 bg-white/50 rounded-xl border border-dashed border-amber-200">
                  Žádné hlavní myšlenky zatím nebyly přidány.
                </p>
              )}
            </div>

            {/* Add new idea input */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={newIdeaText}
                onChange={(e) => setNewIdeaText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIdea()}
                placeholder="Přidat vlastní hlavní myšlenku..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-800"
              />
              <button
                onClick={handleAddIdea}
                className="px-3 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Přidat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-amber-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm text-stone-600 hover:bg-amber-100 transition font-medium cursor-pointer"
          >
            Zavřít
          </button>

          <button
            onClick={handleSaveAll}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold text-xs sm:text-sm transition shadow-xs cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isAlreadyInLibrary ? 'Uložit změny' : 'Uložit do mojí knihovny'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
