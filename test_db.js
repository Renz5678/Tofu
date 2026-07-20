import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: lists, error: err1 } = await supabase.from('reading_lists').select('*');
  console.log('Playlists:', lists);
  if (lists && lists.length > 0) {
    const listId = lists[0].id;
    const { data: items, error: err2 } = await supabase
      .from('reading_list_items')
      .select('*, book:books(*)')
      .eq('reading_list_id', listId);
    console.log('Items for first list:', JSON.stringify(items, null, 2));
    console.log('Items error:', err2);
  }
}
run();
