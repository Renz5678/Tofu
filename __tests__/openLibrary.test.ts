/**
 * Tests for lib/openLibrary.ts — API query builder and response mapper
 */
import { searchBooks } from '@/lib/openLibrary';

// ─────────────────────────────────────────────
// Mock global fetch
// ─────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_API_RESPONSE = {
  docs: [
    {
      key: '/works/OL12345W',
      title: 'The Great Gatsby',
      author_name: ['F. Scott Fitzgerald'],
      cover_i: 1234567,
      number_of_pages_median: 180,
      isbn: ['9780743273565'],
      subject: ['Fiction'],
      language: ['en'],
    },
    {
      key: '/works/OL67890W',
      title: 'No Cover Book',
      // no cover, no authors, no categories
    },
  ],
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('searchBooks', () => {
  it('calls the Open Library API with the correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_API_RESPONSE,
    });

    await searchBooks('Gatsby');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('openlibrary.org/search.json');
    expect(calledUrl).toContain('q=Gatsby');
  });

  it('adds subject to query when genre is provided', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => MOCK_API_RESPONSE });
    await searchBooks('Gatsby', 'fiction');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('subject=fiction');
  });

  it('appends language when provided', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => MOCK_API_RESPONSE });
    await searchBooks('Gatsby', undefined, 'en');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('language=en');
  });

  it('maps response items to BookItem shape', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => MOCK_API_RESPONSE });
    const results = await searchBooks('Gatsby');

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      open_library_id: '/works/OL12345W',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      total_pages: 180,
      isbn: '9780743273565',
      genres: ['Fiction'],
      language: 'en',
      country: null,
    });
  });

  it('builds the correct cover URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => MOCK_API_RESPONSE });
    const results = await searchBooks('Gatsby');
    expect(results[0].cover_url).toBe('https://covers.openlibrary.org/b/id/1234567-M.jpg');
  });

  it('handles items with missing optional fields gracefully', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => MOCK_API_RESPONSE });
    const results = await searchBooks('Gatsby');
    const noDataBook = results[1];
    expect(noDataBook.title).toBe('No Cover Book');
    expect(noDataBook.author).toBeUndefined();
    expect(noDataBook.cover_url).toBeUndefined();
    expect(noDataBook.genres).toEqual([]);
  });

  it('returns empty array when API returns no items', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const results = await searchBooks('xyzzy');
    expect(results).toEqual([]);
  });

  it('throws when API returns a non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(searchBooks('Gatsby')).rejects.toThrow('Open Library API error: 500');
  });
});
