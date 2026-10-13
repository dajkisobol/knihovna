/**
 * Service to fetch book details by ISBN from Knihovny.cz API with Google Books API and Open Library fallbacks,
 * with optional OpenAI enrichment for Czech summaries and main ideas.
 */

/**
 * Converts ISBN (ISBN-10 or ISBN-13) to a clean 13-digit digits-only string.
 * Converts 10-digit ISBN to 13-digit (978 prefix + recalculates checksum).
 */
export function toIsbn13(rawIsbn) {
  if (!rawIsbn) return '';
  const clean = rawIsbn.replace(/[^0-9X]/gi, '').toUpperCase();
  if (clean.length === 13) {
    return clean;
  }
  if (clean.length === 10) {
    const base = '978' + clean.slice(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(base[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
  }
  return clean;
}

export function cleanIsbn(isbn) {
  return toIsbn13(isbn);
}

/**
 * Removes cataloging punctuation (e.g. "Argo,", "Praha :", "[Praha] :")
 */
export function cleanPunctuation(str) {
  if (!str) return '';
  return str
    .replace(/^\[|\]$/g, '')
    .replace(/[\s,:/;\\]+$/, '')
    .replace(/^[\s,:/;\\]+/, '')
    .trim();
}

/**
 * Parses author names from Knihovny.cz authors object and removes trailing years (e.g., "1971-", "1507-1577")
 */
export function parseAuthors(authorsObj) {
  if (!authorsObj || typeof authorsObj !== 'object') return 'Neznámý autor';

  const names = [];
  const primaryKeys = authorsObj.primary ? Object.keys(authorsObj.primary) : [];
  const secondaryKeys = authorsObj.secondary ? Object.keys(authorsObj.secondary) : [];

  const allKeys = [...primaryKeys, ...secondaryKeys];
  for (const rawKey of allKeys) {
    // Remove trailing years like ", 1971-" or ", 1507-1577" or ", 1980"
    const cleaned = rawKey
      .replace(/,\s*\d{3,4}\s*-\s*\d{0,4}/g, '')
      .replace(/,\s*\d{3,4}/g, '')
      .replace(/,\s*asi\s*\d{3,4}\s*-\s*\d{0,4}/gi, '')
      .trim();
    if (cleaned && !names.includes(cleaned)) {
      names.push(cleaned);
    }
  }

  return names.length > 0 ? names.join(', ') : 'Neznámý autor';
}

/**
 * Extracts 4-digit year from publication dates array/string
 */
export function parseYear(datesArray) {
  if (!datesArray) return '';
  const str = Array.isArray(datesArray) ? datesArray.join(' ') : String(datesArray);
  const match = str.match(/\d{4}/);
  return match ? match[0] : '';
}

/**
 * Extracts page count from physical descriptions string/array
 */
export function parsePageCount(physicalDescs) {
  if (!physicalDescs) return null;
  const str = Array.isArray(physicalDescs) ? physicalDescs.join(' ') : String(physicalDescs);
  const match = str.match(/(\d+)\s*(s\.|stran|str\.)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extracts fallback main ideas from a text description if AI is not used.
 */
function extractFallbackMainIdeas(description, title, authors) {
  if (!description || description.trim().length === 0) {
    return [
      `Dílo od autora ${authors || 'neznámého autora'}.`,
      `Kniha s názvem "${title}".`,
      'Bližší podrobnosti a hlavní myšlenky nebyly v databázi nalezeny.'
    ];
  }

  const sentences = description
    .replace(/\r?\n|\r/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length === 0) {
    return [description];
  }

  if (sentences.length <= 3) {
    return sentences;
  }

  return [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1]
  ];
}

/**
 * Clean up HTML tags from description strings
 */
function stripHtmlTags(str) {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '').trim();
}

/**
 * Fetch book from Knihovny.cz API
 */
export async function fetchFromKnihovnyCz(targetIsbn13) {
  const fields = [
    'id',
    'title',
    'authors',
    'publishers',
    'placesOfPublication',
    'publicationDates',
    'physicalDescriptions',
    'isbns',
    'issns',
    'cnb',
    'formats'
  ];

  const params = new URLSearchParams({
    lookfor: targetIsbn13,
    type: 'ISN',
    limit: '10'
  });
  for (const f of fields) {
    params.append('field[]', f);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://www.knihovny.cz/api/v1/search?' + params.toString(), {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const records = data.records ?? [];

    // Find record matching target 13-digit ISBN
    const match = records.find(rec => {
      if (!Array.isArray(rec.isbns)) return false;
      return rec.isbns.some(isbnStr => toIsbn13(isbnStr) === targetIsbn13);
    });

    if (!match) return null;

    const title = cleanPunctuation(match.title) || 'Neznámý název';
    const authors = parseAuthors(match.authors);
    const publisher = match.publishers && match.publishers.length > 0
      ? cleanPunctuation(match.publishers[0])
      : '';
    const publishedDate = parseYear(match.publicationDates);
    const pageCount = parsePageCount(match.physicalDescriptions);

    return {
      isbn: targetIsbn13,
      title,
      authors,
      genre: 'Česká knihovní databáze',
      description: `Kniha evidovaná v katalogu Knihovny.cz (ČNB: ${match.cnb || 'neuvedeno'}).`,
      mainIdeas: extractFallbackMainIdeas('', title, authors),
      coverUrl: '',
      pageCount,
      publisher,
      publishedDate,
      cnb: match.cnb || '',
      source: 'Knihovny.cz'
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Knihovny.cz fetch failed or timed out:', err);
    return null;
  }
}

/**
 * Fetch book information using Knihovny.cz with Google Books & Open Library fallbacks
 */
export async function fetchBookByIsbn(rawIsbn) {
  const isbn13 = toIsbn13(rawIsbn);
  if (!isbn13) {
    throw new Error('Neplatný nebo prázdný kód ISBN.');
  }

  let bookData = null;

  // 1. Try Knihovny.cz API first
  bookData = await fetchFromKnihovnyCz(isbn13);

  // 2. Try Google Books API fallback
  if (!bookData) {
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}`);
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const info = data.items[0].volumeInfo;
          const rawDesc = stripHtmlTags(info.description || '');
          const authors = info.authors ? info.authors.join(', ') : 'Neznámý autor';
          const title = info.title || 'Neznámý název';

          let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
          if (coverUrl.startsWith('http://')) {
            coverUrl = coverUrl.replace('http://', 'https://');
          }

          bookData = {
            isbn: isbn13,
            title,
            authors,
            genre: info.categories ? info.categories.join(', ') : 'Obecná literatura',
            description: rawDesc || 'Popis knihy není k dispozici.',
            mainIdeas: extractFallbackMainIdeas(rawDesc, title, authors),
            coverUrl,
            pageCount: info.pageCount || null,
            publisher: info.publisher || '',
            publishedDate: info.publishedDate || '',
            source: 'Google Books'
          };
        }
      }
    } catch (err) {
      console.warn('Google Books API error, trying Open Library fallback...', err);
    }
  }

  // 3. Fallback to Open Library API
  if (!bookData) {
    try {
      const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`);
      if (olRes.ok) {
        const olData = await olRes.json();
        const bookKey = `ISBN:${isbn13}`;
        if (olData[bookKey]) {
          const info = olData[bookKey];
          const title = info.title || 'Neznámý název';
          const authors = info.authors ? info.authors.map(a => a.name).join(', ') : 'Neznámý autor';
          const genre = info.subjects ? info.subjects.slice(0, 3).map(s => s.name).join(', ') : 'Obecná literatura';
          const coverUrl = info.cover?.large || info.cover?.medium || info.cover?.small || '';

          bookData = {
            isbn: isbn13,
            title,
            authors,
            genre,
            description: 'Popis z rozhraní Open Library není k dispozici v plném znění.',
            mainIdeas: extractFallbackMainIdeas('', title, authors),
            coverUrl,
            pageCount: info.number_of_pages || null,
            publisher: info.publishers ? info.publishers.map(p => p.name).join(', ') : '',
            publishedDate: info.publish_date || '',
            source: 'Open Library'
          };
        }
      }
    } catch (err) {
      console.warn('Open Library API error:', err);
    }
  }

  if (!bookData) {
    throw new Error(`Kniha s ISBN ${isbn13} nebyla v databázích nalezena. Můžete ji zadat ručně.`);
  }

  return bookData;
}

/**
 * Enrich book summary and main ideas with OpenAI if an API key is provided
 */
export async function enrichBookWithOpenAI(book, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return book;
  }

  try {
    const prompt = `Kniha: "${book.title}" od "${book.authors}".
Žánr: ${book.genre || 'Nespecifikován'}.
Existující popis/poznámka: "${book.description}".

Úkol: Napiš stručné a výstižné shrnutí děje v češtině (2-4 věty) a výčet 3 až 5 hlavních myšlenek / poselství této knihy v češtině.
Odpověz výhradně ve formátu JSON:
{
  "summary": "Stručné shrnutí děje v češtině...",
  "mainIdeas": [
    "První hlavní myšlenka...",
    "Druhá hlavní myšlenka...",
    "Třetí hlavní myšlenka..."
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Jsi zkušený literární kritik a knihovník. Tvým úkolem je vytvářet výstižná shrnutí a hlavní myšlenky knih v češtině ve formátu JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenAI API chyba (${response.status})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        ...book,
        description: parsed.summary || book.description,
        mainIdeas: Array.isArray(parsed.mainIdeas) && parsed.mainIdeas.length > 0 ? parsed.mainIdeas : book.mainIdeas,
        aiEnriched: true
      };
    }
  } catch (err) {
    console.error('OpenAI enrichment failed:', err);
    throw err;
  }

  return book;
}
