import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useTierLists, useTierListItems, useUpdateTierListPositions, useAddTierListItem, TierListItem } from '@/hooks/useTierLists';
import { useLibrary } from '@/hooks/useLibrary';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';

const TIER_COLORS: Record<string, string> = {
  S: '#2d3a47',
  A: '#404e5d',
  B: '#576158',
  C: '#d8e2d7',
  D: '#e4e2dd',
};

export default function TierListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { data: tierLists } = useTierLists();
  const { data: items } = useTierListItems(id);
  const { data: libraryBooks = [] } = useLibrary();
  const { mutate: updatePositions } = useUpdateTierListPositions();
  const { mutate: addTierItem } = useAddTierListItem();
  const tierList = tierLists?.find(t => t.id === id);

  const [localItems, setLocalItems] = useState<TierListItem[]>([]);
  const [addingToTier, setAddingToTier] = useState<string | null>(null);

  useEffect(() => {
    if (items) {
      setLocalItems(items);
    }
  }, [items]);

  if (!tierList) return null;

  const tiers = tierList.tiers || [];

  const handleDragEnd = (tier: string, newTierItems: TierListItem[]) => {
    const otherItems = localItems.filter(i => i.tier !== tier);
    const updatedTierItems = newTierItems.map((item, index) => ({
      ...item,
      position: index,
    }));
    
    const nextLocalItems = [...otherItems, ...updatedTierItems];
    setLocalItems(nextLocalItems);
    
    const updates = updatedTierItems.map(item => ({
      id: item.id,
      tier: item.tier,
      book_id: item.book_id,
      position: item.position,
    }));
    
    updatePositions({ listId: id, items: updates });
  };

  const handleAddBook = (bookId: string) => {
    if (!addingToTier) return;
    addTierItem({ listId: id, bookId, tier: addingToTier });
    setAddingToTier(null);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<TierListItem>) => (
    <ScaleDecorator>
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[styles.tierBook, isActive && { opacity: 0.8, transform: [{ scale: 1.05 }] }]}
      >
        <Image
          source={{ uri: item.book.cover_url ?? undefined }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{tierList.title}</Text>
        <TouchableOpacity onPress={() => router.push(`/share/tier-list/${id}` as any)} hitSlop={12}>
          <MaterialIcons name="share" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.noteText}>
          Long press a book to reorder within its tier. Cross-tier dropping coming soon.
        </Text>

        {tiers.map((tier) => {
          const tierData = localItems.filter(i => i.tier === tier).sort((a, b) => a.position - b.position);
          return (
            <View key={tier} style={styles.tierRow}>
              <View style={[styles.tierLabel, { backgroundColor: TIER_COLORS[tier] ?? Colors.surfaceContainer }]}>
                <Text style={[styles.tierLabelText, { color: ['S', 'A', 'B'].includes(tier) ? Colors.onPrimary : Colors.onSurface }]}>
                  {tier.substring(0, 2)}
                </Text>
              </View>
              <DraggableFlatList
                horizontal
                style={{ flex: 1 }}
                data={tierData}
                onDragEnd={({ data }) => handleDragEnd(tier, data)}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.tierBooks}
                showsHorizontalScrollIndicator={false}
                ListFooterComponent={
                  <TouchableOpacity style={styles.tierAddSlot} onPress={() => setAddingToTier(tier)}>
                    <MaterialIcons name="add" size={20} color={Colors.primary} style={{ opacity: 0.5 }} />
                  </TouchableOpacity>
                }
              />
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!addingToTier} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddingToTier(null)}>
        <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
          <View style={[styles.header, { paddingBottom: Spacing.base }]}>
            <TouchableOpacity onPress={() => setAddingToTier(null)} hitSlop={12}>
              <MaterialIcons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add to Tier {addingToTier}</Text>
          </View>
          
          <FlatList
            data={libraryBooks.filter(b => !localItems.some(item => item.book_id === b.book_id))}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
               <TouchableOpacity 
                 style={styles.modalListItem}
                 onPress={() => handleAddBook(item.book_id)}
               >
                  <Image source={{ uri: item.cover_url ?? undefined }} style={styles.modalListCover} />
                  <View style={{ flex: 1 }}>
                     <Text style={styles.modalListTitle} numberOfLines={1}>{item.title}</Text>
                     <Text style={styles.modalListAuthor} numberOfLines={1}>{item.author}</Text>
                  </View>
                  <MaterialIcons name="add-circle-outline" size={24} color={Colors.primary} />
               </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.modalEmpty}>No new books available to add.</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
  },
  headerTitle: { ...Typography.styles.titleSm, color: Colors.onSurface, flex: 1, marginHorizontal: Spacing.stackSm },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.base,
  },
  noteText: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: Spacing.base,
    fontStyle: 'italic',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    minHeight: 80,
    backgroundColor: Colors.surfaceContainerLow,
  },
  tierLabel: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierLabelText: {
    ...Typography.styles.headlineMd,
    fontWeight: '700',
  },
  tierBooks: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    minWidth: '100%',
  },
  tierBook: {
    width: 52,
    height: 72,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
    marginRight: Spacing.base,
  },
  tierAddSlot: {
    width: 52,
    height: 72,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListItem: {
    flexDirection: 'row',
    padding: Spacing.containerPadding,
    alignItems: 'center',
    gap: Spacing.stackMd,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.outlineVariant,
  },
  modalListCover: {
    width: 40,
    height: 60,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  modalListTitle: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
  },
  modalListAuthor: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  modalEmpty: {
    padding: Spacing.containerPadding,
    textAlign: 'center',
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
  },
});
