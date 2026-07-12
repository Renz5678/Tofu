/**
 * useLibrary — manages a user's book collection (user_books joined with books)
 * Handles: fetching by status, adding from Open Library, updating status/page
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BookItem } from '@/lib/openLibrary';

export type BookStatus = 'reading' | 'finished' | 'on_hold';

export interface LibraryBook {
  id: string; // user_books.id
  book_id: string;
  status: BookStatus;
  current_page: number;
  started_at: string | null;
  finished_at: string | null;
  added_at: string;
  // Joined from books table
  open_library_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  total_pages: number | null;
  isbn: string | null;
  genres: string[];
  language: string | null;
}

export type DatabaseBookRow = Omit<LibraryBook, 'id' | 'book_id' | 'status' | 'current_page' | 'started_at' | 'finished_at' | 'added_at'>;

async function fetchLibrary(status?: BookStatus): Promise<LibraryBook[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('user_books')
    .select(`
      id,
      book_id,
      status,
      current_page,
      started_at,
      finished_at,
      added_at,
      books (
        open_library_id,
        title,
        author,
        cover_url,
        total_pages,
        isbn,
        genres,
        language
      )
    `)
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  type JoinedRow = {
    id: string;
    book_id: string;
    status: BookStatus;
    current_page: number;
    started_at: string | null;
    finished_at: string | null;
    added_at: string;
    books: DatabaseBookRow;
  };

  return (data ?? []).map((row: unknown) => {
    const r = row as JoinedRow;
    return {
      id: r.id,
      book_id: r.book_id,
      status: r.status,
      current_page: r.current_page,
      started_at: r.started_at,
      finished_at: r.finished_at,
      added_at: r.added_at,
      ...r.books,
    };
  });
}

export function useLibrary(status?: BookStatus) {
  return useQuery({
    queryKey: ['library', status ?? 'all'],
    queryFn: () => fetchLibrary(status),
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

/** Add a book from Open Library into the user's library */
export function useAddBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      book,
      status = 'reading',
    }: {
      book: BookItem;
      status?: BookStatus;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Upsert the shared book record
      const { data: bookRow, error: bookError } = await supabase
        .from('books')
        .upsert(
          {
            open_library_id: book.open_library_id,
            title: book.title,
            author: book.author ?? null,
            cover_url: book.cover_url ?? null,
            total_pages: book.total_pages ?? null,
            isbn: book.isbn ?? null,
            genres: book.genres,
            language: book.language ?? null,
            country: null,
          },
          { onConflict: 'open_library_id' }
        )
        .select('id')
        .single();

      if (bookError) throw bookError;

      // 2. Insert user_books row
      const { error: userBookError } = await supabase.from('user_books').upsert(
        {
          user_id: user.id,
          book_id: bookRow.id,
          status,
          current_page: 0,
          started_at: status === 'reading' ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,book_id' }
      );

      if (userBookError) throw userBookError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library'] }),
  });
}

/** Update current page and/or status for a user_books row */
export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userBookId,
      currentPage,
      status,
    }: {
      userBookId: string;
      currentPage?: number;
      status?: BookStatus;
    }) => {
      const updates: Record<string, unknown> = {};
      if (currentPage !== undefined) updates.current_page = currentPage;
      if (status !== undefined) {
        updates.status = status;
        if (status === 'finished') updates.finished_at = new Date().toISOString();
      }
      const { error } = await supabase.from('user_books').update(updates).eq('id', userBookId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library'] }),
  });
}
