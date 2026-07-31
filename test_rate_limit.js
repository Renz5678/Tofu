import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function runTest() {
  console.log('1. Signing up test user...');
  const email = `test_spammer_${Date.now()}@example.com`;
  const password = 'password123';
  
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: `spammer_${Date.now()}`,
        display_name: 'Test Spammer'
      }
    }
  });

  if (authErr) {
    console.error('Error signing up:', authErr);
    return;
  }
  
  const userId = authData.user.id;
  console.log('User signed up with ID:', userId);

  // Wait a moment for the profile trigger to complete
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n2. Creating 6 dummy books...');
  const booksToInsert = [];
  for (let i = 0; i < 6; i++) {
    booksToInsert.push({
      open_library_id: `test_ol_${Date.now()}_${i}`,
      title: `Dummy Book ${i}`
    });
  }

  const { data: books, error: booksErr } = await supabase
    .from('books')
    .insert(booksToInsert)
    .select();

  if (booksErr) {
    console.error('Error creating books:', booksErr);
    return;
  }

  console.log(`Created ${books.length} books.`);

  console.log('\n3. Rapidly inserting 6 reviews...');
  for (let i = 0; i < 6; i++) {
    const bookId = books[i].id;
    console.log(`Inserting review ${i + 1} for book ${bookId}...`);
    
    const { data: reviewData, error: reviewErr } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        book_id: bookId,
        rating: 5,
        content: `Spam review ${i}`
      })
      .select();

    if (reviewErr) {
      console.log(`[Review ${i + 1}] Insert failed! Error:`, reviewErr.message || reviewErr);
    } else if (!reviewData || reviewData.length === 0) {
      console.log(`[Review ${i + 1}] Insert returned 0 rows! (Silently aborted by trigger)`);
    } else {
      console.log(`[Review ${i + 1}] Successfully inserted.`);
    }
  }

  console.log('\n4. Checking profile ban status...');
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('review_ban_until, review_offense_count')
    .eq('id', userId)
    .single();

  if (profileErr) {
    console.error('Error fetching profile:', profileErr);
  } else {
    console.log('Profile status:', profile);
    if (profile.review_offense_count > 0 && new Date(profile.review_ban_until) > new Date()) {
      console.log('✅ TEST PASSED: User was successfully banned!');
    } else {
      console.log('❌ TEST FAILED: User was not banned.');
    }
  }
}

runTest();
