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
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography, Spacing, Radius } from '@/theme';

export default function SignUpScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);

    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim(), username: username.trim() },
      },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    // 2. Insert profiles row (user_id = auth.uid())
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.trim().toLowerCase().replace(/\s+/g, '_'),
        display_name: displayName.trim(),
      });
      if (profileError) {
        console.warn('[Tofu] Profile creation error:', profileError.message);
      }
    }

    setLoading(false);

    if (data.session) {
      // Auto-confirmed — go straight to app
      router.replace('/(tabs)/dashboard');
    } else {
      // Email confirmation required
      Alert.alert(
        'Check your email',
        'We sent a confirmation link. Click it, then come back to log in.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/sign-in') }]
      );
    }
  }

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
          <View style={styles.logoIcon}>
            <MaterialIcons name="menu-book" size={28} color={colors.onPrimary} />
          </View>
          <Text style={styles.logoText}>Tofu</Text>
        </View>

        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subheading}>Start tracking your reading journey</Text>

        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Elias Thorne"
            placeholderTextColor={`${colors.onSurfaceVariant}66`}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>

        {/* Username */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>USERNAME</Text>
          <TextInput
            style={styles.input}
            placeholder="elias_reads"
            placeholderTextColor={`${colors.onSurfaceVariant}66`}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
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
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a strong password"
            placeholderTextColor={`${colors.onSurfaceVariant}66`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSignUp}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        {/* Sign in link */}
        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.signInLink}>Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...Typography.styles.headlineMd,
    color: colors.primary,
  },
  heading: {
    ...Typography.styles.headlineMd,
    color: colors.onSurface,
  },
  subheading: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: -Spacing.stackSm,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    ...Typography.styles.labelSm,
    color: colors.primary,
    marginLeft: 4,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 14,
    ...Typography.styles.bodyMd,
    color: colors.onSurface,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: {
    ...Typography.styles.labelLg,
    color: colors.onPrimary,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    ...Typography.styles.bodyMd,
    color: colors.onSurfaceVariant,
  },
  signInLink: {
    ...Typography.styles.labelLg,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
