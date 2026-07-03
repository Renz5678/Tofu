import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { MOCK_BOOKS } from '@/lib/mockData';

const BOOK = MOCK_BOOKS[0];

export default function SessionFinishScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [endPage, setEndPage] = useState(String(BOOK.current_page));
  const [notes, setNotes] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Complete</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy / celebration */}
        <View style={styles.celebrationCard}>
          <Text style={styles.trophyEmoji}>🎉</Text>
          <Text style={styles.celebrationText}>Great reading session!</Text>
          <Text style={styles.celebrationSub}>32 minutes · 18 pages</Text>
        </View>

        {/* Session recap */}
        <View style={[styles.recapCard, Shadows.card]}>
          {/* Book */}
          <View style={styles.bookRow}>
            <View style={styles.cover}>
              <Image source={{ uri: BOOK.cover_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.bookTitle} numberOfLines={2}>{BOOK.title}</Text>
              <Text style={styles.bookAuthor}>{BOOK.author}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem label="Duration" value="32m" />
            <StatItem label="Pages Read" value="18" />
            <StatItem label="Pace" value="42 p/h" />
          </View>
        </View>

        {/* End page input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CURRENT PAGE</Text>
          <TextInput
            style={styles.pageInput}
            value={endPage}
            onChangeText={setEndPage}
            keyboardType="numeric"
            placeholder={String(BOOK.current_page)}
            placeholderTextColor={`${Colors.onSurfaceVariant}66`}
          />
          <Text style={styles.pageHint}>Update your last page read</Text>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SESSION NOTES (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="How was this reading session? Any thoughts on the book?"
            placeholderTextColor={`${Colors.onSurfaceVariant}66`}
            textAlignVertical="top"
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/dashboard')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Save Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/share/session/latest')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="share" size={18} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>Share Reading Recap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  headerTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
  },
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  celebrationCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    alignItems: 'center',
    gap: Spacing.base,
  },
  trophyEmoji: {
    fontSize: 48,
  },
  celebrationText: {
    ...Typography.styles.titleSm,
    color: Colors.onPrimaryContainer,
  },
  celebrationSub: {
    ...Typography.styles.bodyMd,
    color: Colors.onPrimaryContainer,
    opacity: 0.8,
  },
  recapCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.stackSm,
  },
  cover: {
    width: 56,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  bookTitle: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
  },
  bookAuthor: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.stackSm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.outlineVariant,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...Typography.styles.numericXl,
    fontSize: 22,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    ...Typography.styles.labelSm,
    color: Colors.primary,
    marginLeft: 4,
  },
  pageInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 14,
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
  },
  pageHint: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
    marginLeft: 4,
  },
  notesInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 14,
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
    minHeight: 100,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadows.button,
  },
  primaryButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.xl,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.primary,
  },
});
