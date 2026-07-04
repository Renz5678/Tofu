/**
 * Shared top app bar used across tab screens
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/theme';

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
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setMenuVisible(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, height: 56 + insets.top }]}>
      {/* Left: menu + title */}
      <View style={styles.left}>
        <TouchableOpacity onPress={handleMenuPress} hitSlop={12}>
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

      {/* Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuContent, { marginTop: insets.top + 50 }]}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/goals');
              }}
            >
              <MaterialIcons name="track-changes" size={20} color={Colors.primary} />
              <Text style={styles.menuItemText}>Reading Goals</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/(tabs)/profile');
              }}
            >
              <MaterialIcons name="person-outline" size={20} color={Colors.primary} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Coming Soon', 'Settings and preferences will be available soon!');
              }}
            >
              <MaterialIcons name="settings" size={20} color={Colors.onSurfaceVariant} />
              <Text style={[styles.menuItemText, { color: Colors.onSurfaceVariant }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    paddingBottom: Spacing.base,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: Spacing.containerPadding,
  },
  menuContent: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.lg,
    width: 220,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.stackSm,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    ...Typography.styles.labelLg,
    color: Colors.onSurface,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.5,
  },
});
