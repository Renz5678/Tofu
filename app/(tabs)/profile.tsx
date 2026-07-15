import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography, Spacing, Radius, Shadows } from '@/theme';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useReadingSessions } from '@/hooks/useReadingSessions';
import { useLibrary } from '@/hooks/useLibrary';
import {
  useUsernameCheck,
  getUsernameHint,
  type UsernameStatus,
} from '@/hooks/useUsernameCheck';

const MENU_ITEMS = [
  { icon: 'favorite' as const, label: 'My Favorites', route: '/favorites' },
  { icon: 'layers' as const, label: 'Tier Lists', route: '/tier-lists' },
  { icon: 'playlist-play' as const, label: 'Reading Lists', route: '/playlists' },
  { icon: 'flag' as const, label: 'Reading Goals', route: '/goals' },
  { icon: 'history' as const, label: 'Session History', route: '/stats' },
];

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({
  visible,
  currentDisplayName,
  currentUsername,
  onClose,
}: {
  visible: boolean;
  currentDisplayName: string;
  currentUsername: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [username, setUsername] = useState(currentUsername);

  // Real-time check — pass currentUsername so it reports 'available' for unchanged handle
  const { status: usernameStatus } = useUsernameCheck(username, currentUsername);
  const hint = getUsernameHint(usernameStatus);

  const canSave =
    !isPending &&
    displayName.trim().length > 0 &&
    (usernameStatus === 'available');

  function handleUsernameChange(text: string) {
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  }

  async function handleSave() {
    if (!canSave) return;
    try {
      await updateProfile({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Something went wrong.');
    }
  }

  const usernameBorderColor =
    usernameStatus === 'available' ? '#22c55e' :
    usernameStatus === 'taken' || usernameStatus === 'invalid' ? (colors.error ?? '#ef4444') :
    colors.outlineVariant;

  const hintColor =
    hint.color === 'green' ? '#22c55e' :
    hint.color === 'red'   ? (colors.error ?? '#ef4444') :
    hint.color === 'amber' ? '#f59e0b' :
    colors.onSurfaceVariant;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[modalStyles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={[modalStyles.cancelText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[modalStyles.title, { color: colors.onSurface }]}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={!canSave} hitSlop={12}>
            {isPending ? (
              <ActivityIndicator size={16} color={colors.primary} />
            ) : (
              <Text style={[modalStyles.saveText, { color: canSave ? colors.primary : colors.onSurfaceVariant, opacity: canSave ? 1 : 0.4 }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalStyles.body} keyboardShouldPersistTaps="handled">
          {/* Display Name */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.primary }]}>DISPLAY NAME</Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, color: colors.onSurface }]}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              placeholder="Your name"
              placeholderTextColor={`${colors.onSurfaceVariant}66`}
            />
          </View>

          {/* Username */}
          <View style={modalStyles.fieldGroup}>
            <Text style={[modalStyles.label, { color: colors.primary }]}>USERNAME</Text>
            <View style={[modalStyles.usernameRow, { backgroundColor: colors.surfaceContainerLow, borderColor: usernameBorderColor }]}>
              <Text style={[modalStyles.atPrefix, { color: colors.onSurfaceVariant }]}>@</Text>
              <TextInput
                style={[modalStyles.usernameInput, { color: colors.onSurface }]}
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                placeholder="your_username"
                placeholderTextColor={`${colors.onSurfaceVariant}66`}
              />
              {usernameStatus === 'checking' && (
                <ActivityIndicator size={14} color={colors.onSurfaceVariant} style={{ marginRight: 12 }} />
              )}
              {usernameStatus === 'available' && (
                <MaterialIcons name="check-circle" size={16} color="#22c55e" style={{ marginRight: 12 }} />
              )}
              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                <MaterialIcons name="cancel" size={16} color={colors.error ?? '#ef4444'} style={{ marginRight: 12 }} />
              )}
            </View>
            {usernameStatus !== 'idle' && (
              <View style={modalStyles.hintRow}>
                <Text style={[modalStyles.hintText, { color: hintColor }]}>{hint.text}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Profile Screen ───────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profile } = useProfile();
  const { data: sessions = [] } = useReadingSessions();
  const { data: library = [] } = useLibrary();

  const { colors, isDark, mode, setMode } = useTheme();
  const styles = createStyles(colors, isDark);

  const [editVisible, setEditVisible] = useState(false);

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
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            ) : (
              <MaterialIcons name="person" size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
            )}
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>

          {/* Edit Profile button */}
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}
            onPress={() => setEditVisible(true)}
            activeOpacity={0.75}
          >
            <MaterialIcons name="edit" size={14} color={colors.onSurfaceVariant} />
            <Text style={[styles.editButtonText, { color: colors.onSurfaceVariant }]}>Edit Profile</Text>
          </TouchableOpacity>

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

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          visible={editVisible}
          currentDisplayName={profile.display_name ?? ''}
          currentUsername={profile.username}
          onClose={() => setEditVisible(false)}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
    overflow: 'hidden',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: 4,
  },
  editButtonText: {
    ...Typography.styles.labelSm,
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

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerPadding,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    ...Typography.styles.titleSm,
  },
  cancelText: {
    ...Typography.styles.bodyMd,
  },
  saveText: {
    ...Typography.styles.labelLg,
  },
  body: {
    padding: Spacing.containerPadding,
    gap: Spacing.stackMd,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    ...Typography.styles.labelSm,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 14,
    ...Typography.styles.bodyMd,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    height: 52,
  },
  atPrefix: {
    ...Typography.styles.bodyMd,
    paddingLeft: Spacing.gutter,
    paddingRight: 2,
    opacity: 0.6,
  },
  usernameInput: {
    flex: 1,
    ...Typography.styles.bodyMd,
    paddingVertical: 14,
    paddingRight: 4,
  },
  hintRow: {
    marginLeft: 4,
  },
  hintText: {
    ...Typography.styles.labelSm,
  },
});
