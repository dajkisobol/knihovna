import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

// Exact ISBN fallback for saved books whose original metadata had no cover.
// Open Library returns 404 for missing covers (default=false), allowing a graceful fallback.
export function BookCover({ book, className = '', compact = false }) {
  const isbn = String(book?.isbn || '').replace(/[^0-9X]/gi, '');
  const external = book?.coverUrl?.replace?.(/^http:\/\//, 'https://') || '';
  const fallback = isbn.length >= 10 ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg?default=false` : '';
  const [failedUrl, setFailedUrl] = useState('');
  const source = failedUrl === external ? fallback : (external || fallback);
  const unavailable = !source || failedUrl === fallback || (external === fallback && failedUrl === external);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-100 via-[#efe8d8] to-amber-100 flex items-center justify-center ${className}`}>
      {!unavailable ? (
        <img key={source} src={source} alt={`Obálka knihy ${book?.title || ''}`} loading="lazy"
          referrerPolicy="no-referrer" className="w-full h-full object-cover"
          onError={() => setFailedUrl(source)} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-3 text-center text-emerald-900">
          <BookOpen className={compact ? 'w-7 h-7' : 'w-10 h-10'} aria-hidden="true" />
          <span className={compact ? 'text-[10px] line-clamp-2' : 'text-xs line-clamp-3 font-serif font-semibold'}>
            {book?.title || 'Bez obálky'}
          </span>
        </div>
      )}
    </div>
  );
}
