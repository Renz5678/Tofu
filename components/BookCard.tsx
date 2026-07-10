import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverWrapper: {
    aspectRatio: 2 / 3,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
    marginBottom: Spacing.stackSm,
    ...Shadows.card,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  progressOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.full,
    padding: 2,
  },
  title: {
    ...Typography.styles.titleSm,
    color: Colors.onSurface,
    marginBottom: 2,
  },
  author: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
  },
});
