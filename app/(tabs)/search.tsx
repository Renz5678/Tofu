import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { FilterBar } from '@/components/FilterBar';
import { searchBooks, type BookItem } from '@/lib/openLibrary';
import { searchLocalBooks, type LocalSearchResult } from '@/lib/localBookSearch';
import { useLibrary, useAddBook } from '@/hooks/useLibrary';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, useBulkBookStats, BookStats } from '@/hooks/useSocial';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const GENRE_CHIPS = [
  { label: 'Fiction', value: 'fiction' },
  { label: 'Non-Fiction', value: 'nonfiction' },
  { label: 'Science', value: 'science' },
  { label: 'History', value: 'history' },
  { label: 'Biography', value: 'biography' },
  { label: 'Fantasy', value: 'fantasy' },
  { label: 'Philosophy', value: 'philosophy' },
];

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'books' | 'users'>('books');

  const { data: libraryBooks = [] } = useLibrary();

  // ── Book search via TanStack Query ──────────────────────────────────────
  // useQuery automatically passes an AbortSignal to the queryFn so that when
  // debouncedQuery or activeGenre changes, the previous in-flight fetch is
  // cancelled before the new one fires. This eliminates the Android
  // "Network request failed" error caused by dangling / racing XHRs.
  const hasBookSearchInput = searchMode === 'books' && (!!debouncedQuery.trim() || !!activeGenre);
  const {
    data: olResults = [],
    isFetching: olLoading,
    isError: isOLError,
  } = useQuery({
    queryKey: ['bookSearch', debouncedQuery, activeGenre],
    queryFn: ({ signal }) => searchBooks(debouncedQuery, activeGenre ?? undefined, undefined, signal),
    enabled: hasBookSearchInput,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: false,
  });

  // ── Local cache fallback — fires only when Open Library is unreachable ───
  const {
    data: cacheResults = [],
    isFetching: cacheLoading,
  } = useQuery({
    queryKey: ['bookSearchCache', debouncedQuery],
    queryFn: () => searchLocalBooks(debouncedQuery),
    enabled: isOLError && !!debouncedQuery.trim(),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const isFromCache = isOLError && !olLoading;
  const results: (BookItem | LocalSearchResult)[] = isFromCache ? cacheResults : olResults;
  const loading = olLoading || (isFromCache && cacheLoading);
  const isSearchError = isOLError && !cacheLoading && cacheResults.length === 0 && !!debouncedQuery.trim();

  const bookIds = React.useMemo(() => results.map(b => b.open_library_id), [results]);
  const { data: bulkStats } = useBulkBookStats(bookIds);

  const handleQueryChange = (text: string) => {
    setQuery(text);
  };

  const handleGenreSelect = (genre: string | null) => {
    setActiveGenre(genre);
  };



  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors..."
            placeholderTextColor={`${colors.onSurfaceVariant}66`}
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
          />
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      {/* Search Type Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={[styles.toggleBtn, searchMode === 'books' && styles.toggleBtnActive]} 
          onPress={() => setSearchMode('books')}
        >
          <Text style={[styles.toggleBtnText, searchMode === 'books' && styles.toggleBtnTextActive]}>Books</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, searchMode === 'users' && styles.toggleBtnActive]} 
          onPress={() => setSearchMode('users')}
        >
          <Text style={[styles.toggleBtnText, searchMode === 'users' && styles.toggleBtnTextActive]}>Readers</Text>
        </TouchableOpacity>
      </View>

      {/* Genre filter (only for books) */}
      {searchMode === 'books' && (
        <FilterBar
          chips={GENRE_CHIPS}
          activeValue={activeGenre ?? undefined}
          onSelect={handleGenreSelect}
          style={{ paddingHorizontal: Spacing.containerPadding }}
        />
      )}

      {/* Results */}
      {loading ? (
        <View style={[styles.list, { paddingBottom: insets.bottom + 80 }]}>
          {Array.from({ length: 5 }).map((_, i) => <SearchSkeleton key={i} />)}
        </View>
      ) : isSearchError ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="wifi-off" size={56} color={colors.error ?? '#B00020'} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyTitle}>Open Library is unreachable</Text>
          <Text style={styles.emptyDescription}>
            No cached results found for this search. Try again when you're back online.
          </Text>
        </View>
      ) : searchMode === 'books' && results.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="auto-stories" size={56} color={colors.primary} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyTitle}>Find your next read</Text>
          <Text style={styles.emptyDescription}>
            Search any title, author, or pick a genre above
          </Text>
        </View>
      ) : searchMode === 'users' && userResults.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="people" size={56} color={colors.primary} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyTitle}>Find friends</Text>
          <Text style={styles.emptyDescription}>
            Search for other readers by their username or display name
          </Text>
        </View>
      ) : searchMode === 'books' ? (
        <>
          {/* Cached results banner */}
          {isFromCache && results.length > 0 && (
            <View style={styles.cacheBanner}>
              <MaterialIcons name="cloud-off" size={14} color="#92400e" />
              <Text style={styles.cacheBannerText}>
                Open Library offline — showing {results.length} cached result{results.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          <FlatList
            data={results}
            keyExtractor={(item) => item.open_library_id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
            renderItem={({ item }) => (
              <SearchResultCard
                book={item}
                isAdded={libraryBooks.some(b => b.open_library_id === item.open_library_id)}
                stats={bulkStats?.[item.open_library_id]}
                onPress={() => router.push({ pathname: `/discover/${encodeURIComponent(item.open_library_id)}` as any, params: { bookData: JSON.stringify(item) } })}
              />
            )}
          />
        </>
      ) : (
        <FlatList
          data={userResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.resultCard, Shadows.card]} 
              activeOpacity={0.85} 
              onPress={() => router.push(`/profile/${item.id}` as any)}
            >
              <View style={[styles.resultCover, { width: 48, height: 48, borderRadius: 24 }]}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFillObject, styles.noCover, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={{ color: colors.onPrimaryContainer, fontWeight: 'bold' }}>{item.username.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle}>{item.display_name || item.username}</Text>
                <Text style={styles.resultAuthor}>@{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function SearchResultCard({ book, isAdded, stats, onPress }: { book: BookItem; isAdded: boolean; stats?: BookStats; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { mutateAsync: addBook, isPending } = useAddBook();

  const handleAdd = async () => {
    if (isAdded) return;
    try {
      await addBook({ book });
    } catch (e) {
      console.warn('Failed to add book', e);
    }
  };

  return (
    <TouchableOpacity style={[styles.resultCard, Shadows.card]} activeOpacity={0.85} onPress={onPress}>
      {/* Cover */}
      <View style={styles.resultCover}>
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.noCover]}>
            <MaterialIcons name="menu-book" size={32} color={colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{book.title}</Text>
        {book.author && (
          <Text style={styles.resultAuthor} numberOfLines={1}>{book.author}</Text>
        )}
        {book.genres.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {Array.from(new Set(book.genres.flatMap(g => g.split(',').map(s => s.trim())))).slice(0, 2).map((g, i) => {
              const formatted = g.replace(/series:/i, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <View key={i} style={styles.genreChip}>
                  <Text style={styles.genreChipText} numberOfLines={1}>{formatted}</Text>
                </View>
              );
            })}
          </View>
        )}
        {book.total_pages && (
          <Text style={styles.pageCount}>{book.total_pages} pages</Text>
        )}
        
        {/* Ratings & Reviews inline */}
        {stats && (stats.ratings_count > 0 || stats.reviews_count > 0) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {stats.average_rating && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <MaterialIcons name="star" size={14} color="#FFC107" />
                <Text style={{ ...Typography.styles.labelSm, color: colors.onSurface, fontWeight: 'bold' }}>{stats.average_rating}</Text>
              </View>
            )}
            {stats.ratings_count > 0 && (
              <Text style={{ ...Typography.styles.labelSm, color: colors.onSurfaceVariant, fontSize: 11 }}>
                ({stats.ratings_count})
              </Text>
            )}
            {stats.reviews_count > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 4 }}>
                <MaterialIcons name="chat-bubble" size={12} color={colors.onSurfaceVariant} />
                <Text style={{ ...Typography.styles.labelSm, color: colors.onSurfaceVariant, fontSize: 11 }}>
                  {stats.reviews_count}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ ...Typography.styles.labelSm, color: colors.onSurfaceVariant, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
            No ratings yet
          </Text>
        )}
      </View>

      {/* Add button */}
      <TouchableOpacity 
        style={[
          styles.addButton, 
          (isPending || isAdded) && { opacity: 0.5 },
          isAdded && { backgroundColor: colors.primaryContainer }
        ]} 
        onPress={handleAdd}
        disabled={isPending || isAdded}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : isAdded ? (
          <MaterialIcons name="check" size={20} color={colors.primary} />
        ) : (
          <MaterialIcons name="add" size={20} color={colors.onPrimary} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function SearchSkeleton() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const pulseOpacity = useSharedValue(0.3);
  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View style={[styles.resultCard, Shadows.card, animatedStyle]}>
      <View style={[styles.resultCover, { backgroundColor: colors.surfaceContainerHigh }]} />
      <View style={styles.resultInfo}>
        <View style={{ height: 16, width: '80%', backgroundColor: colors.surfaceContainerHigh, borderRadius: 4, marginBottom: 4 }} />
        <View style={{ height: 12, width: '50%', backgroundColor: colors.surfaceContainerHigh, borderRadius: 4, marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={{ height: 16, width: 60, backgroundColor: colors.surfaceContainerHigh, borderRadius: 8 }} />
          <View style={{ height: 16, width: 40, backgroundColor: colors.surfaceContainerHigh, borderRadius: 8 }} />
        </View>
      </View>
      <View style={[styles.addButton, { backgroundColor: colors.surfaceContainerHigh }]} />
    </Animated.View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
  },
  headerTitle: {
    ...Typography.styles.headlineMd,
    color: colors.onSurface,
  },
  searchRow: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    height: 48,
    paddingHorizontal: Spacing.gutter,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    ...Typography.styles.bodyMd,
    color: colors.onSurface,
  },
  toggleRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.containerPadding,
    marginBottom: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  toggleBtnText: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  toggleBtnTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.stackSm,
    paddingHorizontal: Spacing.containerPadding * 2,
  },
  emptyTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
  },
  emptyDescription: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.7,
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.containerPadding,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fef3c7',
    borderRadius: Radius.md,
  },
  cacheBannerText: {
    ...Typography.styles.labelSm,
    color: '#92400e',
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  resultCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    padding: Spacing.stackSm,
    alignItems: 'center',
    gap: Spacing.stackSm,
  },
  resultCover: {
    width: 64,
    height: 96,
    borderRadius: Radius.md,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  noCover: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    ...Typography.styles.titleSm,
    fontSize: 15,
    color: colors.onSurface,
  },
  resultAuthor: {
    ...Typography.styles.bodyMd,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  genreChip: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  genreChipText: {
    ...Typography.styles.labelSm,
    color: colors.onSecondaryContainer,
    fontSize: 10,
  },
  pageCount: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
