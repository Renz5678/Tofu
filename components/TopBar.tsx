/**
 * Shared top app bar used across tab screens
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing } from '@/theme';

interface TopBarProps {
  title?: string;
  streak?: number;
  avatarUrl?: string | null;
  onAvatarPress?: () => void;
  onMenuPress?: () => void;
  rightContent?: React.ReactNode;
}

export function TopBar({
  title = 'Tofu',
  streak,
  avatarUrl,
  onAvatarPress,
  onMenuPress,
  rightContent,
}: TopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Left: menu + title */}
      <View style={styles.left}>
        <TouchableOpacity onPress={onMenuPress} hitSlop={8}>
          <MaterialIcons name="menu" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Right: streak + avatar */}
      <View style={styles.right}>
        {rightContent}
        {streak !== undefined && (
          <View style={styles.streakBadge}>
            <MaterialIcons name="local-fire-department" size={16} color={Colors.tertiaryContainer} />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        )}
        <TouchableOpacity onPress={onAvatarPress} hitSlop={8}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <MaterialIcons name="person" size={20} color={Colors.onSurfaceVariant} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    height: 56 + 0, // 56 + safeArea padding added dynamically
    paddingBottom: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.styles.headlineMd,
    color: Colors.primary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.gutter,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  streakText: {
    ...Typography.styles.labelLg,
    color: Colors.onSecondaryContainer,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
});
