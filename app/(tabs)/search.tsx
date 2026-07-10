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
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { FilterBar } from '@/components/FilterBar';
import { searchBooks, type BookItem } from '@/lib/openLibrary';
import { useLibrary, useAddBook } from '@/hooks/useLibrary';
import { useDebounce } from '@/hooks/useDebounce';
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [synopsis, setSynopsis] = useState<string | null>(null);
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);

  const { data: libraryBooks = [] } = useLibrary();

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 50) {
          setSelectedBook(null);
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (!debouncedQuery.trim() && !activeGenre) {
      setResults([]);
      setLoading(false);
      return;
    }
    const runSearch = async () => {
      setLoading(true);
      try {
        const res = await searchBooks(debouncedQuery, activeGenre ?? undefined);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    runSearch();
  }, [debouncedQuery, activeGenre]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
  };

  const handleGenreSelect = (genre: string | null) => {
    setActiveGenre(genre);
  };

  React.useEffect(() => {
    if (!selectedBook) {
      setSynopsis(null);
      return;
    }
    const fetchSynopsis = async () => {
      setLoadingSynopsis(true);
      try {
        // open_library_id is usually like /works/OL123W
        const res = await fetch(`https://openlibrary.org${selectedBook.open_library_id}.json`);
        const data = await res.json();
        if (data.description) {
          const desc = typeof data.description === 'string' ? data.description : data.description.value;
          setSynopsis(desc);
        } else {
          setSynopsis(null);
        }
      } catch (e) {
        setSynopsis(null);
      } finally {
        setLoadingSynopsis(false);
      }
    };
    fetchSynopsis();
  }, [selectedBook]);

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
      {loading ? (
        <View style={[styles.list, { paddingBottom: insets.bottom + 80 }]}>
          {Array.from({ length: 5 }).map((_, i) => <SearchSkeleton key={i} />)}
        </View>
      ) : results.length === 0 ? (
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
          keyExtractor={(item) => item.open_library_id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          renderItem={({ item }) => (
            <SearchResultCard 
              book={item} 
              isAdded={libraryBooks.some(b => b.open_library_id === item.open_library_id)}
              onPress={() => setSelectedBook(item)}
            />
          )}
        />
      )}

      {/* Book Details Modal */}
      <Modal
        visible={!!selectedBook}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBook(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSelectedBook(null)}
          />
          <View style={[styles.modalContent, { maxHeight: '90%', paddingBottom: insets.bottom + 24 }]}>
            <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            <TouchableOpacity 
              style={styles.modalClose} 
              onPress={() => setSelectedBook(null)}
              hitSlop={12}
            >
              <MaterialIcons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>

            {selectedBook && (
              <ScrollView 
                contentContainerStyle={styles.modalBody}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.modalCover}>
                  {selectedBook.cover_url ? (
                    <Image source={{ uri: selectedBook.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFillObject, styles.noCover]}>
                      <MaterialIcons name="menu-book" size={48} color={Colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
                    </View>
                  )}
                </View>
                
                <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                {selectedBook.author && <Text style={styles.modalAuthor}>{selectedBook.author}</Text>}
                
                <View style={styles.modalStatsColumn}>
                  {selectedBook.total_pages && (
                    <View style={styles.modalStatRow}>
                      <View style={styles.modalStatIcon}>
                        <MaterialIcons name="menu-book" size={20} color={Colors.primary} />
                      </View>
                      <View style={styles.modalStatTextContainer}>
                        <Text style={styles.modalStatLabel}>Length</Text>
                        <Text style={styles.modalStatValue}>{selectedBook.total_pages} pages</Text>
                      </View>
                    </View>
                  )}
                  {selectedBook.genres && selectedBook.genres.length > 0 && (
                    <View style={styles.modalStatRow}>
                      <View style={styles.modalStatIcon}>
                        <MaterialIcons name="category" size={20} color={Colors.primary} />
                      </View>
                      <View style={styles.modalStatTextContainer}>
                        <Text style={styles.modalStatLabel}>Genres</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                          {Array.from(new Set(selectedBook.genres.flatMap(g => g.split(',').map(s => s.trim())))).slice(0, 5).map((g, i) => {
                            const formatted = g.replace(/series:/i, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            return (
                              <View key={i} style={styles.modalGenreChip}>
                                <Text style={styles.modalGenreChipText}>{formatted}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}
                  {selectedBook.language && (
                    <View style={styles.modalStatRow}>
                      <View style={styles.modalStatIcon}>
                        <MaterialIcons name="language" size={20} color={Colors.primary} />
                      </View>
                      <View style={styles.modalStatTextContainer}>
                        <Text style={styles.modalStatLabel}>Language</Text>
                        <Text style={[styles.modalStatValue, {textTransform: 'uppercase'}]}>{selectedBook.language}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {loadingSynopsis ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.base }} />
                ) : synopsis ? (
                  <View style={styles.synopsisContainer}>
                    <Text style={styles.synopsisTitle}>Synopsis</Text>
                    <Text style={styles.synopsisText}>
                      {synopsis
                        .replace(/\[([^\]]*pdf[^\]]*)\]\([^\)]+\)/gi, '') // Remove PDF links entirely
                        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove other markdown links but keep text
                        .replace(/\bpdf\b\.*/gi, '') // Remove any stray "pdf" text
                        .replace(/\*\*/g, '') // Remove bold asterisks
                        .replace(/\*/g, '')   // Remove italic asterisks
                        .replace(/__/g, '')   // Remove underline/bold
                        .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
                        .trim()}
                    </Text>
                  </View>
                ) : null}
                
                <TouchableOpacity 
                  style={styles.modalAddButton}
                  onPress={() => setSelectedBook(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalAddText}>Close Details</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SearchResultCard({ book, isAdded, onPress }: { book: BookItem; isAdded: boolean; onPress: () => void }) {
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
      </View>

      {/* Add button */}
      <TouchableOpacity 
        style={[
          styles.addButton, 
          (isPending || isAdded) && { opacity: 0.5 },
          isAdded && { backgroundColor: Colors.primaryContainer }
        ]} 
        onPress={handleAdd}
        disabled={isPending || isAdded}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={Colors.onPrimary} />
        ) : isAdded ? (
          <MaterialIcons name="check" size={20} color={Colors.primary} />
        ) : (
          <MaterialIcons name="add" size={20} color={Colors.onPrimary} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function SearchSkeleton() {
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
      <View style={[styles.resultCover, { backgroundColor: Colors.surfaceContainerHigh }]} />
      <View style={styles.resultInfo}>
        <View style={{ height: 16, width: '80%', backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, marginBottom: 4 }} />
        <View style={{ height: 12, width: '50%', backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={{ height: 16, width: 60, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 8 }} />
          <View style={{ height: 16, width: 40, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 8 }} />
        </View>
      </View>
      <View style={[styles.addButton, { backgroundColor: Colors.surfaceContainerHigh }]} />
    </Animated.View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.containerPadding,
    ...Shadows.overlay,
  },
  modalClose: {
    position: 'absolute',
    top: Spacing.containerPadding,
    right: Spacing.containerPadding,
    zIndex: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.full,
    padding: 6,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.stackSm,
    marginBottom: Spacing.stackSm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
  },
  modalBody: {
    alignItems: 'center',
    paddingTop: Spacing.stackLg,
    gap: Spacing.stackSm,
  },
  modalCover: {
    width: 140,
    height: 210,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: 'hidden',
    ...Shadows.card,
    marginBottom: Spacing.base,
  },
  modalTitle: {
    ...Typography.styles.headlineMd,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  modalAuthor: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.8,
  },
  modalStatsColumn: {
    width: '100%',
    gap: Spacing.stackSm,
    marginTop: Spacing.base,
    marginBottom: Spacing.stackLg,
  },
  modalStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: Spacing.stackSm,
  },
  modalStatIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStatTextContainer: {
    flex: 1,
  },
  modalStatLabel: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  modalStatValue: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
  },
  modalGenreChip: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalGenreChipText: {
    ...Typography.styles.labelSm,
    color: Colors.onSurface,
    fontSize: 11,
  },
  synopsisContainer: {
    width: '100%',
    marginBottom: Spacing.stackLg,
    gap: Spacing.stackSm,
    paddingHorizontal: Spacing.stackSm,
  },
  synopsisTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
    textAlign: 'left',
  },
  synopsisText: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
    textAlign: 'left',
  },
  modalAddButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
  },
  modalAddText: {
    ...Typography.styles.labelLg,
    color: Colors.onSurface,
  },
});
