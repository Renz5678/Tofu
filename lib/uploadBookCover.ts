/**
 * uploadBookCover.ts
 *
 * Fire-and-forget utility that downloads an Open Library cover image and
 * uploads it to Supabase Storage so covers remain visible even when
 * openlibrary.org is unreachable.
 *
 * Call this AFTER the books row is confirmed written — it runs in the
 * background and writes cover_storage_url back to the books row on success.
 * Any failure is silently swallowed so it never blocks the add-book flow.
 */
import { supabase } from '@/lib/supabase';

const BUCKET = 'book-covers';

/**
 * Download the cover from Open Library and re-upload to Supabase Storage.
 * Writes `cover_storage_url` back to the books row on success.
 *
 * @param bookId     — the `books.id` UUID (used as the storage path)
 * @param coverUrl   — the original Open Library cover URL
 */
export async function uploadBookCover(bookId: string, coverUrl: string): Promise<void> {
  try {
    // 1. Check if we already have a stored copy — skip if so
    const { data: existing } = await supabase
      .from('books')
      .select('cover_storage_url')
      .eq('id', bookId)
      .single();

    if (existing?.cover_storage_url) return; // already cached

    // 2. Download the cover image
    const res = await fetch(coverUrl, { headers: { Accept: 'image/*' } });
    if (!res.ok) return;

    const blob = await res.blob();
    const ext = blob.type === 'image/png' ? 'png' : 'jpg';
    const path = `${bookId}.${ext}`;

    // 3. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) return;

    // 4. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    // 5. Write back to the books row
    await supabase
      .from('books')
      .update({ cover_storage_url: publicUrl })
      .eq('id', bookId);

  } catch {
    // Silently swallow — cover caching is best-effort and must never
    // block or error the add-book user flow.
  }
}
