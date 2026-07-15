/**
 * localBookSearch.ts
 *
 * Searches the shared `books` table in Supabase — the book cache that grows
 * automatically every time any Tofu user adds a book to their library.
 *
 * Used as a fallback when Open Library is unreachable.
 */
import { supabase } from '@/lib/supabase';
import type { BookItem } from '@/lib/openLibrary';

export interface LocalSearchResult extends BookItem {
  /** True when this result came from the local cache, not Open Library */
  fromCache: true;
}

/**
 * Search the local books table by title and author.
 *
 * Strategy (in order):
 *  1. Full-text search via the `fts` tsvector column (relevance ranked)
 *  2. Falls back to ilike if the fts returns nothing (handles short/partial queries)
 *
 * Returns at most 20 results, shaped as BookItem so the UI needs no changes.
 */
export async function searchLocalBooks(query: string): Promise<LocalSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  // 1. Full-text search — best for multi-word queries
  const { data: ftsData, error: ftsError } = await supabase
    .from('books')
    .select('open_library_id, title, author, cover_storage_url, cover_url, total_pages, isbn, genres, language, country')
    .textSearch('fts', q, { type: 'websearch', config: 'english' })
    .limit(20);

  if (!ftsError && ftsData && ftsData.length > 0) {
    return ftsData.map(toLocalResult);
  }

  // 2. ilike fallback — handles short/partial queries like "harr"
  const { data: ilikeData } = await supabase
    .from('books')
    .select('open_library_id, title, author, cover_storage_url, cover_url, total_pages, isbn, genres, language, country')
    .or(`title.ilike.%${q}%,author.ilike.%${q}%`)
    .order('title', { ascending: true })
    .limit(20);

  return (ilikeData ?? []).map(toLocalResult);
}

function toLocalResult(row: any): LocalSearchResult {
  return {
    open_library_id: row.open_library_id,
    title: row.title,
    author: row.author ?? undefined,
    // Prefer the Supabase-hosted copy; fall back to the Open Library CDN URL
    cover_url: row.cover_storage_url ?? row.cover_url ?? undefined,
    total_pages: row.total_pages ?? undefined,
    isbn: row.isbn ?? undefined,
    genres: row.genres ?? [],
    language: row.language ?? undefined,
    country: null,
    fromCache: true,
  };
}
