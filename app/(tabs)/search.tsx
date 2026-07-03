import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { FilterBar } from '@/components/FilterBar';
import { searchBooks, type GoogleBookItem } from '@/lib/googleBooks';

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = (q: string, genre?: string | null) => {
    if (!q.trim() && !genre) {
      setResults([]);
      return;
    }
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchBooks(q, genre ?? undefined);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    setSearchTimer(t);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    runSearch(text, activeGenre);
  };

  const handleGenreSelect = (genre: string | null) => {
    setActiveGenre(genre);
    runSearch(query, genre);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors..."
            placeholderTextColor={`${Colors.onSurfaceVariant}66`}
            value={query}
            onChangeText={handleQueryChange}
            autoCorrect={false}
          />
          {loading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
      </View>

      {/* Genre filter */}
      <FilterBar
        chips={GENRE_CHIPS}
        activeValue={activeGenre ?? undefined}
        onSelect={handleGenreSelect}
        style={{ paddingHorizontal: Spacing.containerPadding }}
      />

      {/* Results */}
      {results.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="auto-stories" size={56} color={Colors.primary} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyTitle}>Find your next read</Text>
          <Text style={styles.emptyDescription}>
            Search any title, author, or pick a genre above
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.google_books_id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          renderItem={({ item }) => <SearchResultCard book={item} />}
        />
      )}
    </View>
  );
}

function SearchResultCard({ book }: { book: GoogleBookItem }) {
  return (
    <TouchableOpacity style={[styles.resultCard, Shadows.card]} activeOpacity={0.85}>
      {/* Cover */}
      <View style={styles.resultCover}>
        {book.cover_url ? (
          <Image source={{ uri: book.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.noCover]}>
            <MaterialIcons name="menu-book" size={32} color={Colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
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
          <View style={styles.genreChip}>
            <Text style={styles.genreChipText}>{book.genres[0]}</Text>
          </View>
        )}
        {book.total_pages && (
          <Text style={styles.pageCount}>{book.total_pages} pages</Text>
        )}
      </View>

      {/* Add button */}
      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons name="add" size={20} color={Colors.onPrimary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
  },
  headerTitle: {
    ...Typography.styles.headlineMd,
    color: Colors.onSurface,
  },
  searchRow: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    height: 48,
    paddingHorizontal: Spacing.gutter,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
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
    color: Colors.onSurface,
  },
  emptyDescription: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.7,
  },
  list: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  resultCard: {
    backgroundColor: Colors.surfaceContainerLowest,
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
    backgroundColor: Colors.surfaceContainerHigh,
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
    color: Colors.onSurface,
  },
  resultAuthor: {
    ...Typography.styles.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  genreChip: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  genreChipText: {
    ...Typography.styles.labelSm,
    color: Colors.onSecondaryContainer,
    fontSize: 10,
  },
  pageCount: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
