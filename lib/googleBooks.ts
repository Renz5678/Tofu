/**
 * Google Books API helpers
 */
export interface GoogleBookItem {
  google_books_id: string;
  title: string;
  author: string | undefined;
  cover_url: string | undefined;
  total_pages: number | undefined;
  isbn: string | undefined;
  genres: string[];
  language: string | undefined;
  country: null; // Not reliably available from Google Books
}

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export async function searchBooks(query: string, genre?: string, language?: string): Promise<GoogleBookItem[]> {
  let q = query;
  if (genre) q = `subject:${genre} ${q}`;

  const params = new URLSearchParams({ q, maxResults: '20' });
  if (language) params.set('langRestrict', language);

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item: any) => ({
    google_books_id: item.id,
    title: item.volumeInfo?.title ?? 'Unknown Title',
    author: item.volumeInfo?.authors?.join(', '),
    cover_url: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://'),
    total_pages: item.volumeInfo?.pageCount,
    isbn: item.volumeInfo?.industryIdentifiers?.[0]?.identifier,
    genres: item.volumeInfo?.categories ?? [],
    language: item.volumeInfo?.language,
    country: null,
  }));
}
