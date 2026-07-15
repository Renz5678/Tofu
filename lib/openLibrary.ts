/**
 * Open Library API helpers
 */
export interface BookItem {
  open_library_id: string;
  title: string;
  author: string | undefined;
  cover_url: string | undefined;
  total_pages: number | undefined;
  isbn: string | undefined;
  genres: string[];
  language: string | undefined;
  country: null;
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  isbn?: string[];
  subject?: string[];
  language?: string[];
}

export async function searchBooks(
  query: string,
  genre?: string,
  language?: string,
  signal?: AbortSignal,
): Promise<BookItem[]> {
  const params = [
    `q=${encodeURIComponent(query || '*')}`,
    `limit=20`,
    `fields=key,title,author_name,cover_i,number_of_pages_median,isbn,subject,language`,
  ];
  if (genre) params.push(`subject=${encodeURIComponent(genre)}`);
  if (language) params.push(`language=${encodeURIComponent(language)}`);

  const url = `https://openlibrary.org/search.json?${params.join('&')}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (err: any) {
    // The whatwg-fetch polyfill (used on Android) maps xhr.abort() to
    // TypeError('Network request failed') instead of DOMException('AbortError').
    // TanStack Query only suppresses errors whose name === 'AbortError', so we
    // re-map it here. If the signal was NOT aborted it's a genuine network
    // failure and we re-throw so the error UI is shown correctly.
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }
    throw err;
  }

  if (!res.ok) throw new Error(`Open Library API error: ${res.status}`);

  const data = await res.json();
  const rawBooks: BookItem[] = (data.docs || []).map((doc: OpenLibraryDoc) => ({
    open_library_id: doc.key,
    title: doc.title,
    author: doc.author_name?.join(', '),
    cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
    total_pages: doc.number_of_pages_median,
    isbn: doc.isbn?.[0],
    genres: doc.subject?.slice(0, 3) || [],
    language: doc.language?.[0],
    country: null,
  }));

  // Deduplicate by normalised title + author fingerprint.
  // Open Library contains many duplicate Works/editions for the same book —
  // this keeps only the first occurrence of each unique title/author pair.
  const seen = new Set<string>();
  const uniqueBooks: BookItem[] = [];
  for (const book of rawBooks) {
    const title = book.title.toLowerCase().trim();
    const author = book.author ? book.author.toLowerCase().trim() : '__unknown__';
    const fingerprint = `${title}|${author}`;
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      uniqueBooks.push(book);
    }
  }

  return uniqueBooks;
}

/**
 * Fetch the synopsis/description for a book from the Open Library Works API.
 * The `openLibraryId` is the Works key, e.g. "/works/OL45804W".
 * Returns null if no description is available or the request fails.
 *
 * Callers should wrap this in a TanStack Query hook for caching.
 */
export async function fetchSynopsis(openLibraryId: string): Promise<string | null> {
  try {
    const url = `https://openlibrary.org${openLibraryId}.json`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.description) return null;
    // description can be a plain string or { type, value } object
    return typeof data.description === 'string'
      ? data.description
      : data.description?.value ?? null;
  } catch {
    return null;
  }
}
