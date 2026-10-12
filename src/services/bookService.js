/**
 * Service to fetch book details by ISBN from Google Books API and Open Library API,
 * with optional OpenAI enrichment for Czech summaries and main ideas.
 */

export function cleanIsbn(isbn) {
  if (!isbn) return '';
  return isbn.replace(/[^0-9X]/gi, '');
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

  // Split description into sentences
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

  // Take first sentence, middle sentence, and last sentence or top 3 significant sentences
  return [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1]
  ];
}

/**
 * Clean up HTML tags from description strings returned by APIs
 */
function stripHtmlTags(str) {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '').trim();
}

/**
 * Fetch book information using Google Books API with Open Library fallback
 */
export async function fetchBookByIsbn(rawIsbn) {
  const isbn = cleanIsbn(rawIsbn);
  if (!isbn) {
    throw new Error('Neplatný nebo prázdný kód ISBN.');
  }

  let bookData = null;

  // 1. Try Google Books API
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
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
          isbn,
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

  // 2. Fallback to Open Library API if Google Books didn't return data
  if (!bookData) {
    try {
      const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      if (olRes.ok) {
        const olData = await olRes.json();
        const bookKey = `ISBN:${isbn}`;
        if (olData[bookKey]) {
          const info = olData[bookKey];
          const title = info.title || 'Neznámý název';
          const authors = info.authors ? info.authors.map(a => a.name).join(', ') : 'Neznámý autor';
          const genre = info.subjects ? info.subjects.slice(0, 3).map(s => s.name).join(', ') : 'Obecná literatura';
          const coverUrl = info.cover?.large || info.cover?.medium || info.cover?.small || '';

          bookData = {
            isbn,
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
    throw new Error(`Kniha s ISBN ${isbn} nebyla v databázích nalezena. Můžete ji zadat ručně.`);
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
