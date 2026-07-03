/**
 * Mock data for scaffolding screens before real Supabase data is wired
 */

export interface MockBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  total_pages: number;
  current_page: number;
  status: 'reading' | 'finished' | 'on_hold';
  genres: string[];
  language: string;
}

export const MOCK_BOOKS: MockBook[] = [
  {
    id: '1',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    cover_url: 'https://covers.openlibrary.org/b/id/10901714-L.jpg',
    total_pages: 304,
    current_page: 198,
    status: 'reading',
    genres: ['Fiction', 'Fantasy'],
    language: 'en',
  },
  {
    id: '2',
    title: 'The Silent Garden',
    author: 'Elena Rostova',
    cover_url: 'https://covers.openlibrary.org/b/id/8739161-L.jpg',
    total_pages: 280,
    current_page: 196,
    status: 'reading',
    genres: ['Literary Fiction'],
    language: 'en',
  },
  {
    id: '3',
    title: 'Foundations of Thought',
    author: 'Dr. Julian Vane',
    cover_url: 'https://covers.openlibrary.org/b/id/8951034-L.jpg',
    total_pages: 400,
    current_page: 100,
    status: 'reading',
    genres: ['Non-Fiction', 'Philosophy'],
    language: 'en',
  },
  {
    id: '4',
    title: 'Midnight in Kyoto',
    author: 'Satoshi Nakamura',
    cover_url: 'https://covers.openlibrary.org/b/id/9317858-L.jpg',
    total_pages: 320,
    current_page: 288,
    status: 'reading',
    genres: ['Fiction', 'Travel'],
    language: 'ja',
  },
  {
    id: '5',
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    cover_url: 'https://covers.openlibrary.org/b/id/9255566-L.jpg',
    total_pages: 662,
    current_page: 662,
    status: 'finished',
    genres: ['Fantasy'],
    language: 'en',
  },
  {
    id: '6',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    cover_url: 'https://covers.openlibrary.org/b/id/8739161-L.jpg',
    total_pages: 443,
    current_page: 220,
    status: 'on_hold',
    genres: ['Non-Fiction', 'History'],
    language: 'en',
  },
];

export const MOCK_USER = {
  id: 'mock-user-id',
  display_name: 'Alex',
  username: 'alex_reads',
  avatar_url: null,
};

export const MOCK_STATS = {
  todayMinutes: 45,
  todayPages: 28,
  dailyGoalMinutes: 60,
  dailyGoalPages: 40,
  currentStreak: 12,
  weeklyData: [48, 75, 35, 80, 62, 20, 15], // Mon–Sun minutes
  totalBooksRead: 24,
  totalPagesRead: 6842,
  avgPagesPerHour: 42,
};

export const MOCK_FAVORITES: MockBook[] = MOCK_BOOKS.slice(0, 5).map((b, i) => ({
  ...b,
  rank: i + 1,
})) as any;

export const MOCK_TIER_LIST = {
  id: 'tier-1',
  title: 'My 2024 Reading Tier List',
  tiers: ['S', 'A', 'B', 'C', 'D'],
  items: [
    { id: 'ti-1', book: MOCK_BOOKS[0], tier: 'S', position: 0 },
    { id: 'ti-2', book: MOCK_BOOKS[4], tier: 'S', position: 1 },
    { id: 'ti-3', book: MOCK_BOOKS[1], tier: 'A', position: 0 },
    { id: 'ti-4', book: MOCK_BOOKS[2], tier: 'B', position: 0 },
    { id: 'ti-5', book: MOCK_BOOKS[3], tier: 'A', position: 1 },
  ],
};

export const MOCK_PLAYLISTS = [
  {
    id: 'pl-1',
    title: 'Evening Wind-Down',
    description: 'Books for before bed',
    books: MOCK_BOOKS.slice(0, 3),
    is_public: false,
  },
  {
    id: 'pl-2',
    title: 'Mind Expanders',
    description: 'Non-fiction that shifts perspective',
    books: MOCK_BOOKS.slice(2, 5),
    is_public: true,
  },
];
