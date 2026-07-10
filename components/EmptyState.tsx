import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Typography, Spacing } from '@/theme';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'menu-book',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <MaterialIcons name={icon} size={48} color={colors.primary} style={{ opacity: 0.4 }} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.containerPadding * 2,
    paddingVertical: Spacing.stackLg,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.stackMd,
  },
  title: {
    ...Typography.styles.titleSm,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  description: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.stackMd,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.stackMd,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    ...Typography.styles.labelLg,
    color: colors.onPrimary,
  },
});
