import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography, Spacing, Radius } from '@/theme';
import {
  useUsernameCheck,
  getUsernameHint,
  type UsernameStatus,
} from '@/hooks/useUsernameCheck';

function UsernameStatusRow({ status }: { status: UsernameStatus }) {
  const { colors } = useTheme();
  const hint = getUsernameHint(status);

  const iconName =
    status === 'available' ? 'check-circle' :
    status === 'taken' || status === 'invalid' ? 'cancel' :
    status === 'checking' ? 'hourglass-empty' :
    'info-outline';

  const color =
    hint.color === 'green' ? '#22c55e' :
    hint.color === 'red'   ? (colors.error ?? '#ef4444') :
    hint.color === 'amber' ? '#f59e0b' :
    colors.onSurfaceVariant;

  if (status === 'idle') {
    return (
      <Text style={[styles.hintText, { color: colors.onSurfaceVariant, opacity: 0.6 }]}>
        {hint.text}
      </Text>
    );
  }

  return (
    <View style={styles.hintRow}>
      {status === 'checking' ? (
        <ActivityIndicator size={12} color={color} />
      ) : (
        <MaterialIcons name={iconName as any} size={14} color={color} />
      )}
      <Text style={[styles.hintText, { color }]}>{hint.text}</Text>
    </View>
  );
}

export default function PickUsernameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const { status: usernameStatus } = useUsernameCheck(username);
  const canSubmit = !loading && usernameStatus === 'available';

  function handleUsernameChange(text: string) {
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  }

  async function handleSave() {
    if (!canSubmit) return;
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const cleanUsername = username.trim().toLowerCase();

      // Upsert the profile (in case it doesn't exist at all, or just needs updating)
      // We also set a default display name based on their email or Google name
      const defaultName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         cleanUsername;

      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: cleanUsername,
          display_name: defaultName,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
        { onConflict: 'id' }
      );

      if (error) throw error;
      
      // Update the user_metadata so the JWT reflects it if needed later
      await supabase.auth.updateUser({
        data: { username: cleanUsername }
      });

      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  const borderColor = 
    usernameStatus === 'available' ? '#22c55e' :
    usernameStatus === 'taken' || usernameStatus === 'invalid' ? (colors.error ?? '#ef4444') :
    colors.outlineVariant;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.heading, { color: colors.onSurface }]}>Pick a username</Text>
        <Text style={[styles.subheading, { color: colors.onSurfaceVariant }]}>
          Your Google account doesn't have a valid username yet. Choose one to continue.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.primary }]}>USERNAME</Text>
          <View style={[styles.usernameRow, { backgroundColor: colors.surfaceContainerLow, borderColor }]}>
            <Text style={[styles.atPrefix, { color: colors.onSurfaceVariant }]}>@</Text>
            <TextInput
              style={[styles.usernameInput, { color: colors.onSurface }]}
              placeholder="elias_reads"
              placeholderTextColor={`${colors.onSurfaceVariant}66`}
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              autoFocus
            />
            {usernameStatus === 'checking' && (
              <ActivityIndicator size={16} color={colors.onSurfaceVariant} style={{ marginRight: 12 }} />
            )}
            {usernameStatus === 'available' && (
              <MaterialIcons name="check-circle" size={18} color="#22c55e" style={{ marginRight: 12 }} />
            )}
            {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
              <MaterialIcons name="cancel" size={18} color={colors.error ?? '#ef4444'} style={{ marginRight: 12 }} />
            )}
          </View>
          <UsernameStatusRow status={usernameStatus} />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            !canSubmit && styles.primaryButtonDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    gap: Spacing.stackMd,
  },
  heading: {
    ...Typography.styles.headlineMd,
  },
  subheading: {
    ...Typography.styles.bodyMd,
    marginTop: -Spacing.stackSm,
    marginBottom: Spacing.base,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    ...Typography.styles.labelSm,
    marginLeft: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 4,
  },
  hintText: {
    ...Typography.styles.labelSm,
    marginLeft: 4,
  },
  primaryButton: {
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginTop: Spacing.stackLg,
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: {
    ...Typography.styles.labelLg,
  },
});
