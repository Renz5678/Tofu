import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function SharePreviewScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="close" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Recap</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.previewArea}>
        {/* Share card placeholder — full rendering is a follow-up task */}
        <View style={styles.shareCard}>
          <View style={styles.shareCardHeader}>
            <MaterialIcons name="menu-book" size={32} color={Colors.onPrimary} />
            <Text style={styles.shareCardBrand}>Tofu</Text>
          </View>
          <Text style={styles.shareCardType}>{getTypeLabel(type)}</Text>
          <Text style={styles.shareCardId}>ID: {id}</Text>
          <Text style={styles.shareCardNote}>
            Share card rendering will be implemented in a follow-up task.{'\n'}
            (react-native-view-shot + expo-sharing)
          </Text>
        </View>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.shareButton} activeOpacity={0.85}>
          <MaterialIcons name="share" size={20} color={Colors.onPrimary} />
          <Text style={styles.shareButtonText}>Share Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadButton} activeOpacity={0.85}>
          <MaterialIcons name="download" size={20} color={Colors.primary} />
          <Text style={styles.downloadButtonText}>Save to Photos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getTypeLabel(type?: string): string {
  switch (type) {
    case 'session': return 'Reading Session Recap';
    case 'favorites': return 'My Favorites';
    case 'tier-list': return 'Tier List';
    case 'playlist': return 'Reading List';
    default: return 'Reading Recap';
  }
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
  headerTitle: { ...Typography.styles.titleSm, color: Colors.onSurface },
  previewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.containerPadding,
  },
  shareCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    alignItems: 'center',
    gap: Spacing.stackSm,
    aspectRatio: 9 / 16,
    justifyContent: 'center',
  },
  shareCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareCardBrand: {
    ...Typography.styles.headlineMd,
    color: Colors.onPrimary,
  },
  shareCardType: {
    ...Typography.styles.titleSm,
    color: Colors.onPrimaryContainer,
    textAlign: 'center',
  },
  shareCardId: {
    ...Typography.styles.labelSm,
    color: `${Colors.onPrimary}88`,
  },
  shareCardNote: {
    ...Typography.styles.labelSm,
    color: `${Colors.onPrimary}66`,
    textAlign: 'center',
    marginTop: Spacing.stackMd,
    fontSize: 11,
  },
  actions: {
    paddingHorizontal: Spacing.containerPadding,
    paddingTop: Spacing.stackSm,
    gap: Spacing.stackSm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
  },
  shareButtonText: { ...Typography.styles.labelLg, color: Colors.onPrimary },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Radius.xl,
    paddingVertical: 16,
  },
  downloadButtonText: { ...Typography.styles.labelLg, color: Colors.primary },
});
