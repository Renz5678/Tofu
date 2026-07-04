import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { TopBar } from '@/components/TopBar';
import { BookCard } from '@/components/BookCard';
import { FilterBar, StatusTabs } from '@/components/FilterBar';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'expo-router';
import { useLibrary, type BookStatus } from '@/hooks/useLibrary';
import { useProfile } from '@/hooks/useProfile';

const STATUS_TABS = [
  { label: 'Reading', value: 'reading' },
  { label: 'Finished', value: 'finished' },
  { label: 'On Hold', value: 'on_hold' },
];

const GENRE_CHIPS = [
  { label: 'Genre', value: 'genre' },
  { label: 'Language', value: 'language' },
  { label: 'Status', value: 'status' },
  { label: 'Country', value: 'country' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<BookStatus>('reading');

  const { data: profile } = useProfile();
  const { data: libraryBooks = [], isLoading } = useLibrary(activeStatus);

  const filtered = libraryBooks.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q));
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <TopBar avatarUrl={profile?.avatar_url ?? undefined} onAvatarPress={() => router.push('/(tabs)/profile')} />

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your library..."
            placeholderTextColor={`${Colors.onSurfaceVariant}66`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FilterBar chips={GENRE_CHIPS} style={{ paddingHorizontal: Spacing.containerPadding }} />

      <StatusTabs tabs={STATUS_TABS} activeValue={activeStatus} onSelect={(v) => setActiveStatus(v as BookStatus)} />

      {filtered.length === 0 ? (
        <EmptyState
          icon="menu-book"
          title="No books here yet"
          description={`You haven't added any ${activeStatus.replace('_', ' ')} books yet.`}
          actionLabel="Search for books"
          onAction={() => router.push('/(tabs)/search')}
        />
      ) : (
        <FlatList
          key={'3-columns'}
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: insets.bottom + 80 },
          ]}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={{ flex: 1, maxWidth: '31%' }}>
              <BookCard
                id={item.id}
                title={item.title}
                author={item.author ?? 'Unknown Author'}
                coverUrl={item.cover_url ?? undefined}
                currentPage={item.current_page}
                totalPages={item.total_pages ?? undefined}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    height: 48,
    paddingHorizontal: Spacing.gutter,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
  },
  grid: {
    padding: Spacing.containerPadding,
    gap: Spacing.stackMd,
  },
  gridRow: {
    gap: Spacing.gutter,
  },
});
