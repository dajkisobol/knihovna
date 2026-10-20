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
export function stripHtmlTags(str) {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '').trim();
}

/**
 * Extracts description or annotation text from Knihovny.cz record fields
 */
export function parseKnihovnyCzDescription(match) {
  if (!match) return '';
  const parts = [];

  if (Array.isArray(match.summary) && match.summary.length > 0) {
    parts.push(...match.summary);
  } else if (typeof match.summary === 'string' && match.summary.trim()) {
    parts.push(match.summary.trim());
  }

  if (Array.isArray(match.notes) && match.notes.length > 0) {
    parts.push(...match.notes);
  } else if (typeof match.notes === 'string' && match.notes.trim()) {
    parts.push(match.notes.trim());
  }

  if (Array.isArray(match.contents) && match.contents.length > 0) {
    parts.push(...match.contents);
  } else if (typeof match.contents === 'string' && match.contents.trim()) {
    parts.push(match.contents.trim());
  }

  return parts.map(p => stripHtmlTags(p)).filter(Boolean).join('\n\n');
}

/**
 * Generates structured plot summary, main ideas, character notes, and reader recommendations
 */
export function generateStructuredDetails(rawDesc, title, authors, genre = 'Obecná literatura') {
  const cleanDesc = stripHtmlTags(rawDesc).trim();

  let description = cleanDesc;
  if (!description) {
    description = `Kniha "${title}" od autora ${authors || 'neznámého autora'} v žánru ${genre}. Podrobné literární dílo z knižního katalogu.`;
  }

  const mainIdeas = extractFallbackMainIdeas(cleanDesc, title, authors);

  let characterNotes = '';
  if (cleanDesc.length > 50) {
    characterNotes = `Příběh a děj knihy "${title}" vykresluje klíčové postavy, jejich motivace a vztahy z pera autora ${authors}.`;
  } else {
    characterNotes = `Postavy a autorův styl v díle "${title}" od autora ${authors}.`;
  }

  let recommendation = '';
  if (genre && genre !== 'Obecná literatura' && genre !== 'Česká knihovní databáze') {
    recommendation = `Doporučujeme čtenářům, kteří se zajímají o žánr ${genre} a díla od autora ${authors}.`;
  } else {
    recommendation = `Doporučujeme čtenářům vyhledávajícím tvorbu autora ${authors} a kvalitní literaturu.`;
  }

  return {
    description,
    mainIdeas,
    characterNotes,
    recommendation
  };
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
    'formats',
    'summary',
    'notes',
    'contents'
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
    const rawDesc = parseKnihovnyCzDescription(match);
    const structured = generateStructuredDetails(rawDesc, title, authors, 'Česká knihovní databáze');

    return {
      isbn: targetIsbn13,
      title,
      authors,
      genre: 'Česká knihovní databáze',
      description: structured.description,
      mainIdeas: structured.mainIdeas,
      characterNotes: structured.characterNotes,
      recommendation: structured.recommendation,
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
 * Fetch book information using Knihovny.cz with Google Books & Open Library fallbacks and enrichments
 */
export async function fetchBookByIsbn(rawIsbn) {
  const isbn13 = toIsbn13(rawIsbn);
  if (!isbn13) {
    throw new Error('Neplatný nebo prázdný kód ISBN.');
  }

  let bookData = null;

  // 1. Try Knihovny.cz API first
  bookData = await fetchFromKnihovnyCz(isbn13);

  // 2. Query Google Books API for cover image or missing description
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}`);
    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo;
        const gDesc = stripHtmlTags(info.description || '');
        const gAuthors = info.authors ? info.authors.join(', ') : '';
        const gTitle = info.title || '';
        const gGenre = info.categories ? info.categories.join(', ') : '';

        let coverUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
        if (coverUrl.startsWith('http://')) {
          coverUrl = coverUrl.replace('http://', 'https://');
        }

        if (bookData) {
          if (!bookData.coverUrl && coverUrl) {
            bookData.coverUrl = coverUrl;
          }
          // If Knihovny.cz description was empty/short/generic, replace/enrich with Google Books description
          if (gDesc && (bookData.description.includes('Kniha "') || bookData.description.length < 80)) {
            const structured = generateStructuredDetails(gDesc, bookData.title, bookData.authors, gGenre || bookData.genre);
            bookData.description = structured.description;
            bookData.mainIdeas = structured.mainIdeas;
            bookData.characterNotes = structured.characterNotes;
            bookData.recommendation = structured.recommendation;
            if (gGenre) bookData.genre = gGenre;
          }
        } else {
          const structured = generateStructuredDetails(gDesc, gTitle, gAuthors, gGenre || 'Obecná literatura');
          bookData = {
            isbn: isbn13,
            title: gTitle || 'Neznámý název',
            authors: gAuthors || 'Neznámý autor',
            genre: gGenre || 'Obecná literatura',
            description: structured.description,
            mainIdeas: structured.mainIdeas,
            characterNotes: structured.characterNotes,
            recommendation: structured.recommendation,
            coverUrl,
            pageCount: info.pageCount || null,
            publisher: info.publisher || '',
            publishedDate: info.publishedDate || '',
            source: 'Google Books'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Google Books API check error:', err);
  }

  // 3. Query Open Library API for fallback or missing cover
  if (!bookData || !bookData.coverUrl) {
    try {
      const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`);
      if (olRes.ok) {
        const olData = await olRes.json();
        const bookKey = `ISBN:${isbn13}`;
        if (olData[bookKey]) {
          const info = olData[bookKey];
          const olTitle = info.title || 'Neznámý název';
          const olAuthors = info.authors ? info.authors.map(a => a.name).join(', ') : 'Neznámý autor';
          const olGenre = info.subjects ? info.subjects.slice(0, 3).map(s => s.name).join(', ') : 'Obecná literatura';
          const coverUrl = info.cover?.large || info.cover?.medium || info.cover?.small || '';

          if (bookData) {
            if (!bookData.coverUrl && coverUrl) {
              bookData.coverUrl = coverUrl;
            }
          } else {
            const structured = generateStructuredDetails('', olTitle, olAuthors, olGenre);
            bookData = {
              isbn: isbn13,
              title: olTitle,
              authors: olAuthors,
              genre: olGenre,
              description: structured.description,
              mainIdeas: structured.mainIdeas,
              characterNotes: structured.characterNotes,
              recommendation: structured.recommendation,
              coverUrl,
              pageCount: info.number_of_pages || null,
              publisher: info.publishers ? info.publishers.map(p => p.name).join(', ') : '',
              publishedDate: info.publish_date || '',
              source: 'Open Library'
            };
          }
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
export async function enrichBookWithOpenAI(book, apiKey, customPrompt = '') {
  if (!apiKey || !apiKey.trim()) {
    return book;
  }

  try {
    const basePrompt = `Kniha: "${book.title}" od "${book.authors}".
Žánr: ${book.genre || 'Nespecifikován'}.
Nakladatel: ${book.publisher || 'Není uveden'}. Rok: ${book.publishedDate || 'Není uveden'}. ČNB: ${book.cnb || 'Není uvedeno'}.
Existující popis/poznámka: "${book.description}".

Úkol: Vytvoř detailní a poutavý literární rozbor v češtině.
1. Napiš výstižné shrnutí děje v češtině (3-5 vět).
2. Výčet 3 až 5 hlavních myšlenek / poselství.
3. Přidej doporučení, pro jakého čtenáře se kniha hodí.
4. Přidej stručný popis postav nebo kontextu autora.
${customPrompt ? `Doplňující požadavek od uživatele: "${customPrompt}"` : ''}

Odpověz výhradně ve formátu JSON:
{
  "summary": "Detailní shrnutí děje v češtině...",
  "mainIdeas": [
    "První hlavní myšlenka...",
    "Druhá hlavní myšlenka...",
    "Třetí hlavní myšlenka..."
  ],
  "recommendation": "Komu knihu doporučujeme...",
  "characterNotes": "Postavy a kontext díla..."
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
          { role: 'system', content: 'Jsi zkušený literární kritik a knihovník. Tvým úkolem je vytvářet výstižná a podrobná shrnutí knih v češtině ve formátu JSON.' },
          { role: 'user', content: basePrompt }
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
        recommendation: parsed.recommendation || book.recommendation || '',
        characterNotes: parsed.characterNotes || book.characterNotes || '',
        aiEnriched: true
      };
    }
  } catch (err) {
    console.error('OpenAI enrichment failed:', err);
    throw err;
  }

  return book;
}
