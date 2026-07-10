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
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useProfile } from '@/hooks/useProfile';
import { useReadingSessions } from '@/hooks/useReadingSessions';
import { useLibrary } from '@/hooks/useLibrary';

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
  
  const { data: profile } = useProfile();
  const { data: sessions = [] } = useReadingSessions();
  const { data: library = [] } = useLibrary();

  const { colors, isDark, mode, setMode } = useTheme();
  const styles = createStyles(colors, isDark);

  const totalBooksRead = library.filter(b => b.status === 'finished').length;
  const currentStreak = profile?.streak?.current_streak ?? 0;
  const isStreakActive = currentStreak >= 3;
  const totalPagesRead = sessions.reduce((acc, s) => acc + s.pages_read, 0);

  const displayName = profile?.display_name || 'Reader';
  const username = profile?.username || 'user';

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

  function handleThemeChange() {
    Alert.alert('Appearance', 'Select your preferred theme', [
      { text: 'Light', onPress: () => setMode('light') },
      { text: 'Dark', onPress: () => setMode('dark') },
      { text: 'System', onPress: () => setMode('system') },
    ], { cancelable: true });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            <MaterialIcons name="person" size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>

          {/* Quick stats row */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{totalBooksRead}</Text>
              <Text style={styles.quickStatLabel}>Books</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatValue, !isStreakActive && { color: colors.onSurfaceVariant, opacity: 0.6 }]}>
                {isStreakActive ? currentStreak : `${currentStreak}/3`}
              </Text>
              <Text style={styles.quickStatLabel}>
                {isStreakActive ? 'Day Streak' : 'to Streak'}
              </Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{totalPagesRead > 1000 ? `${Math.round(totalPagesRead / 1000)}k` : totalPagesRead}</Text>
              <Text style={styles.quickStatLabel}>Pages</Text>
            </View>
          </View>
        </View>

        {/* Menu items */}
        <Text style={styles.sectionTitle}>Library & Stats</Text>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuRow, i > 0 && styles.menuRowBorder]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <MaterialIcons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={handleThemeChange}>
            <View style={styles.menuIconWrap}>
              <MaterialIcons name="palette" size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Appearance</Text>
            <Text style={{ ...Typography.styles.bodyMd, color: colors.onSurfaceVariant, textTransform: 'capitalize', marginRight: 8 }}>{mode}</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={18} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.secondaryContainer,
  },
  displayName: {
    ...Typography.styles.headlineMd,
    color: colors.onSurface,
  },
  username: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    opacity: 0.7,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    gap: Spacing.stackMd,
    marginTop: Spacing.base,
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 24,
    elevation: 4,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    ...Typography.styles.numericXl,
    fontSize: 28,
    color: colors.primary,
  },
  quickStatLabel: {
    ...Typography.styles.labelSm,
    color: colors.onSurfaceVariant,
  },
  quickStatDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'stretch',
  },
  sectionTitle: {
    ...Typography.styles.labelLg,
    color: colors.onSurfaceVariant,
    paddingLeft: 4,
    marginBottom: -8,
    marginTop: Spacing.stackSm,
  },
  menuCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: isDark ? '#000' : '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 24,
    elevation: 4,
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
    borderTopColor: colors.outlineVariant,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...Typography.styles.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    backgroundColor: colors.errorContainer,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    marginTop: Spacing.stackMd,
  },
  signOutText: {
    ...Typography.styles.labelLg,
    color: colors.error,
  },
});
