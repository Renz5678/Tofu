import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { MOCK_USER, MOCK_STATS } from '@/lib/mockData';

const MENU_ITEMS = [
  { icon: 'favorite' as const, label: 'My Favorites', route: '/favorites' },
  { icon: 'layers' as const, label: 'Tier Lists', route: '/tier-lists' },
  { icon: 'playlist-play' as const, label: 'Reading Lists', route: '/playlists' },
  { icon: 'flag' as const, label: 'Reading Goals', route: '/goals' },
  { icon: 'history' as const, label: 'Session History', route: '/stats' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <MaterialIcons name="person" size={48} color={Colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
          </View>
          <Text style={styles.displayName}>{MOCK_USER.display_name}</Text>
          <Text style={styles.username}>@{MOCK_USER.username}</Text>

          {/* Quick stats row */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{MOCK_STATS.totalBooksRead}</Text>
              <Text style={styles.quickStatLabel}>Books</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{MOCK_STATS.currentStreak}</Text>
              <Text style={styles.quickStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{Math.round(MOCK_STATS.totalPagesRead / 1000)}k</Text>
              <Text style={styles.quickStatLabel}>Pages</Text>
            </View>
          </View>
        </View>

        {/* Menu items */}
        <View style={[styles.menuCard, Shadows.card]}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuRow, i > 0 && styles.menuRowBorder]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <MaterialIcons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    gap: Spacing.stackMd,
  },
  profileHeader: {
    alignItems: 'center',
    gap: Spacing.base,
    paddingVertical: Spacing.stackMd,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.secondaryContainer,
  },
  displayName: {
    ...Typography.styles.headlineMd,
    color: Colors.onSurface,
  },
  username: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
    marginTop: Spacing.base,
    ...Shadows.card,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    ...Typography.styles.numericXl,
    fontSize: 28,
    color: Colors.primary,
  },
  quickStatLabel: {
    ...Typography.styles.labelSm,
    color: Colors.onSurfaceVariant,
  },
  quickStatDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'stretch',
  },
  menuCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.stackMd,
    paddingVertical: Spacing.stackSm + 4,
    gap: Spacing.stackSm,
  },
  menuRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.outlineVariant,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.errorContainer,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    marginTop: Spacing.base,
  },
  signOutText: {
    ...Typography.styles.labelLg,
    color: Colors.error,
  },
});
