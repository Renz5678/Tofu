import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { ProgressRing } from './ProgressRing';
import { readingProgress } from '@/lib/metrics';

export interface BookCardProps {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  currentPage?: number;
  totalPages?: number;
  showProgress?: boolean;
  style?: object;
}

export function BookCard({
  id,
  title,
  author,
  coverUrl,
  currentPage = 0,
  totalPages = 0,
  showProgress = true,
  style,
}: BookCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const progress = readingProgress(currentPage, totalPages);
  const progressPercent = Math.round(progress * 100);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/book/${id}` as any)}
      style={[styles.container, style]}
    >
      {/* Cover image */}
      <View style={styles.coverWrapper}>
        <Image
          source={coverUrl ? { uri: coverUrl } : require('@/assets/placeholder-cover.png')}
          style={styles.cover}
          contentFit="cover"
          transition={300}
        />
        {/* Progress ring overlay */}
        {showProgress && totalPages > 0 && progress < 1 && (
          <View style={styles.progressOverlay}>
            <ProgressRing
              progress={progress}
              size={44}
              strokeWidth={3}
              showLabel
              labelText={`${progressPercent}%`}
            />
          </View>
        )}
      </View>

      {/* Metadata */}
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.author} numberOfLines={1}>{author}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  coverWrapper: {
    aspectRatio: 2 / 3,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: Spacing.stackSm,
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  progressOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.92)',
    borderRadius: Radius.full,
    padding: 2,
  },
  title: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
    marginBottom: 2,
  },
  author: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
});
