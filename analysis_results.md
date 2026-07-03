# Codebase Analysis & Integration Report

We have completed the core visual scaffolding and the SDK upgrade of the Tofu mobile reading tracker. Here is a breakdown of what has been implemented so far, what is currently mocked, and the precise features remaining to be built.

---

## 1. Current Implementation Status

| Feature / Component | State | Current Code Status | Database / API Integration |
| :--- | :--- | :--- | :--- |
| **Auth Setup & Flow** | **Implemented** | `app/(auth)/sign-in.tsx`<br>`app/(auth)/sign-up.tsx` | Supabase Auth API (`signUp` and `signInWithPassword`) with client-side user profile creation/upsert. |
| **Environment Config** | **Implemented** | `.env`, `lib/supabase.ts` | Connected to real Supabase URL and anon keys. |
| **Theme / Design System** | **Implemented** | `theme/tokens.ts`, `theme/index.ts` | Complete Material 3 token library (updated to Slate Blue `#2d3a47`). |
| **Dashboard** | **Visual Only** | `app/(tabs)/dashboard.tsx` | Reads from `MOCK_STATS` and `MOCK_BOOKS`. No live database reads. |
| **Library & Search** | **Visual Only** | `app/(tabs)/library.tsx`<br>`app/(tabs)/search.tsx` | Search logic hooks up to mock books. Add-to-library and library list are local-only. |
| **Session Tracker** | **Visual Only** | `app/session/active.tsx`<br>`app/session/finish.tsx` | Timer works in UI but logs are not sent to `reading_sessions` or stored in the database. |
| **Goals & Streaks** | **Visual Only** | `app/goals/index.tsx` | Rings and streaks pull from static numbers. |
| **Curation Layer** | **Visual Only** | `app/favorites/index.tsx`<br>`app/playlists/index.tsx`<br>`app/tier-lists/index.tsx` | Drag and drop, cover collages, and slot additions are local arrays. |
| **Share Sheet** | **Offline** | `app/share/[type]/[id].tsx` | Uses `react-native-view-shot` to screenshot the mock-populated templates. |

---

## 2. Missing Core Components (What We Still Need to Build)

### A. React Query Hooks (`hooks/` Directory)
As defined in the spec, we must abstract Supabase communication into React Query hooks rather than querying Supabase directly from UI components.
We need to create the following hooks:
*   `hooks/useLibrary.ts`: Fetch the user's books, search local libraries, and handle addition (`user_books` and `books` tables).
*   `hooks/useReadingSessions.ts`: Fetch reading history and log new sessions into `reading_sessions`.
*   `hooks/useFavorites.ts`: Manage top 5 book slots in `favorite_books`.
*   `hooks/useTierLists.ts`: Query, create, and update boards inside `tier_lists` and `tier_list_items`.
*   `hooks/usePlaylists.ts`: Handle reading lists (`reading_lists` and `reading_list_items`) with custom positions and layouts.
*   `hooks/useProfile.ts`: Retrieve active session user profile details, streak status, and goals.

### B. Google Books API Integration (`lib/googleBooks.ts`)
While `lib/googleBooks.ts` exists, the search page (`app/(tabs)/search.tsx`) needs to be fully wired to execute the real Google Books API search query rather than returning `MOCK_BOOKS`.

### C. Active Timer Persistence (`store/sessionStore.ts` & `lib/timer.ts`)
We need to wire up `AsyncStorage` to store current timer progress so that the state of an active session survives app relaunches, as specified in the context.

### D. Streaks & Metrics Math (`lib/metrics.ts`)
We need to connect the helper methods in `lib/metrics.ts` directly to the session completion flows to calculate streaks, page increments, and velocities, updating the `streaks` and `profiles` tables in Supabase in real-time.

---

## 3. Next Steps
To begin integration, we should proceed in the recommended build order:
1. Create the `hooks/` directory and implement the `useProfile` and `useLibrary` hooks first.
2. Replace mock data imports with these hooks in the Dashboard and Library tabs.
3. Wire the Search tab to the Google Books API query.
4. Integrate the active session timer with Supabase's `reading_sessions` logging.
