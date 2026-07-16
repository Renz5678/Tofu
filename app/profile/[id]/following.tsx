import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useFollowingList } from '@/hooks/useSocial';

export default function FollowingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const { data: following, isLoading } = useFollowingList(id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Following</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : following?.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="person-add-disabled" size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={styles.emptyText}>Not following anyone yet.</Text>
        </View>
      ) : (
        <FlatList
          data={following}
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

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingBottom: Spacing.stackSm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
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
});
