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
import { useTheme, Typography, Spacing, Radius } from '@/theme';
import { TopBar } from '@/components/TopBar';
import { BookCard } from '@/components/BookCard';
import { StatusTabs } from '@/components/FilterBar';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'expo-router';
import { useLibrary, type BookStatus } from '@/hooks/useLibrary';
import { useProfile } from '@/hooks/useProfile';

const STATUS_TABS = [
  { label: 'Reading', value: 'reading' },
  { label: 'Finished', value: 'finished' },
  { label: 'On Hold', value: 'on_hold' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<BookStatus>('reading');
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const { data: profile } = useProfile();
  const { data: libraryBooks = [], isLoading } = useLibrary(activeStatus);

  const filtered = libraryBooks.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q));
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar avatarUrl={profile?.avatar_url ?? undefined} onAvatarPress={() => router.push('/(tabs)/profile')} />

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your library..."
            placeholderTextColor={`${colors.onSurfaceVariant}66`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/favorites')}
        >
          <MaterialIcons name="favorite" size={20} color={colors.error} />
          <Text style={styles.actionButtonText}>Liked Books</Text>
        </TouchableOpacity>
      </View>

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

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  searchRow: {
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: Spacing.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
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
    color: colors.onSurface,
  },
  actionRow: {
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.base,
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 8,
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  actionButtonText: {
    ...Typography.styles.labelLg,
    color: colors.onSurface,
  },
  grid: {
    padding: Spacing.containerPadding,
    gap: Spacing.stackMd,
  },
  gridRow: {
    gap: Spacing.gutter,
  },
});
