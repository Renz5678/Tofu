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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography, Spacing, Radius } from '@/theme';
import { useUsernameCheck, getUsernameHint, type UsernameStatus } from '@/hooks/useUsernameCheck';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

// ── Username status indicator ─────────────────────────────────────────────────
function UsernameStatusRow({ status }: { status: UsernameStatus }) {
  const { colors } = useTheme();
  const hint = getUsernameHint(status);

  const iconName =
    status === 'available'
      ? 'check-circle'
      : status === 'taken' || status === 'invalid'
        ? 'cancel'
        : status === 'checking'
          ? 'hourglass-empty'
          : 'info-outline';

  const color =
    hint.color === 'green'
      ? '#22c55e'
      : hint.color === 'red'
        ? (colors.error ?? '#ef4444')
        : hint.color === 'amber'
          ? '#f59e0b'
          : colors.onSurfaceVariant;

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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SignUpScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Real-time username availability
  const { status: usernameStatus } = useUsernameCheck(username);
  const canSubmit =
    !loading &&
    displayName.trim().length > 0 &&
    usernameStatus === 'available' &&
    email.trim().length > 0 &&
    password.length >= 8;

  // Sanitise: lowercase + remove anything that's not a-z 0-9 _
  function handleUsernameChange(text: string) {
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  }

  async function handleSignUp() {
    if (!canSubmit) return;

    setLoading(true);

    // 1. Create auth user — pass username in raw_user_meta_data so the
    //    DB trigger (handle_new_user) can write the correct username.
    const cleanUsername = username.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: makeRedirectUri({
          scheme: 'tofu',
          path: 'auth/callback',
        }),
        data: {
          display_name: displayName.trim(),
          username: cleanUsername,
          has_set_profile: true,
        },
      },
    });

    if (error) {
      setLoading(false);
      console.error('\n[SUPABASE SIGN UP ERROR] ============================');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      console.error('=====================================================\n');
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    // 2. Safety-net upsert — in case the DB trigger fired before the
    //    raw_user_meta_data was available (edge case).
    if (data.user) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          username: cleanUsername,
          display_name: displayName.trim(),
        },
        { onConflict: 'id' },
      );
    }

    setLoading(false);

    if (data.session) {
      router.replace('/(tabs)/dashboard');
    } else {
      Alert.alert(
        'Check your email',
        'We sent a confirmation link. Click it, then come back to log in.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/sign-in') }],
      );
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    const redirectTo = makeRedirectUri({
      scheme: 'tofu',
      path: 'auth/callback',
    });

    const { error, data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Google Sign Up Failed', error.message);
      return;
    }

    if (data?.url) {
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type === 'success' && res.url) {
        const { params, errorCode } = QueryParams.getQueryParams(res.url);
        if (errorCode) {
          Alert.alert('Google Sign Up Failed', errorCode);
        } else if (params?.access_token && params?.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) {
            Alert.alert('Google Sign Up Failed', sessionError.message);
          } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && !user.user_metadata?.has_set_profile) {
              router.replace('/(auth)/pick-username');
            } else {
              router.replace('/(tabs)/dashboard');
            }
          }
        }
      }
    }
    setLoading(false);
  }

  const borderColor = (field: 'username') => {
    if (field === 'username') {
      if (usernameStatus === 'available') return '#22c55e';
      if (usernameStatus === 'taken' || usernameStatus === 'invalid')
        return colors.error ?? '#ef4444';
    }
    return colors.outlineVariant;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image 
            source={isDark ? require('@/assets/app-icon/iconWithoutBGDarkMode.png') : require('@/assets/app-icon/iconWithoutBG.png')} 
            style={{ width: 48, height: 48 }}
            resizeMode="contain"
          />
          <Text style={[styles.logoText, { color: colors.primary }]}>Tofu</Text>
        </View>

        <Text style={[styles.heading, { color: colors.onSurface }]}>Create your account</Text>
        <Text style={[styles.subheading, { color: colors.onSurfaceVariant }]}>
          Start tracking your reading journey
        </Text>
        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.primary }]}>Display Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.outlineVariant,
                color: colors.onSurface,
              },
            ]}
            placeholder="BaggyPants123"
            placeholderTextColor={`${colors.onSurfaceVariant}66`}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>

        {/* Username */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.primary }]}>Username</Text>
          {/* Input row with @ prefix */}
          <View
            style={[
              styles.usernameRow,
              { backgroundColor: colors.surfaceContainerLow, borderColor: borderColor('username') },
            ]}
          >
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
            />
            {/* Status icon on the right */}
            {usernameStatus === 'checking' && (
              <ActivityIndicator
                size={16}
                color={colors.onSurfaceVariant}
                style={{ marginRight: 12 }}
              />
            )}
            {usernameStatus === 'available' && (
              <MaterialIcons
                name="check-circle"
                size={18}
                color="#22c55e"
                style={{ marginRight: 12 }}
              />
            )}
            {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
              <MaterialIcons
                name="cancel"
                size={18}
                color={colors.error ?? '#ef4444'}
                style={{ marginRight: 12 }}
              />
            )}
          </View>
          <UsernameStatusRow status={usernameStatus} />
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.primary }]}>Email Address</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.outlineVariant,
                color: colors.onSurface,
              },
            ]}
            placeholder="elias@books.com"
            placeholderTextColor={`${colors.onSurfaceVariant}66`}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.primary }]}>Password</Text>
          <View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="Create a strong password"
              placeholderTextColor={`${colors.onSurfaceVariant}66`}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
          {password.length > 0 && password.length < 8 && (
            <Text style={[styles.hintText, { color: colors.error ?? '#ef4444' }]}>
              Password must be at least 8 characters.
            </Text>
          )}
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            !canSubmit && styles.primaryButtonDisabled,
          ]}
          onPress={handleSignUp}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        {/* OR Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
          <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
        </View>

        {/* Google Button */}
        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
          onPress={handleGoogleSignUp}
          disabled={loading}
        >
          <MaterialIcons name="g-translate" size={24} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.googleButtonText, { color: colors.onSurface }]}>Sign up with Google</Text>
        </TouchableOpacity>

        {/* Sign in link */}
        <View style={styles.signInRow}>
          <Text style={[styles.signInText, { color: colors.onSurfaceVariant }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={[styles.signInLink, { color: colors.primary }]}>Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.containerPadding,
    gap: Spacing.stackMd,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: Spacing.base,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...Typography.styles.headlineMd,
  },
  heading: {
    ...Typography.styles.headlineMd,
  },
  subheading: {
    ...Typography.styles.bodyMd,
    marginTop: -Spacing.stackSm,
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
  // Username field — row with @ prefix and status icon
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
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  primaryButton: {
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: {
    ...Typography.styles.labelLg,
  },
  googleButton: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonText: {
    ...Typography.styles.labelLg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.gutter,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cccccc', // Will be overridden by theme colors dynamically if needed, but keeping simple
  },
  dividerText: {
    ...Typography.styles.labelSm,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    ...Typography.styles.bodyMd,
  },
  signInLink: {
    ...Typography.styles.labelLg,
    textDecorationLine: 'underline',
  },
});
