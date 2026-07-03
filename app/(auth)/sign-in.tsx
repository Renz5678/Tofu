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
import { Colors, Typography, Spacing, Radius } from '@/theme';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <MaterialIcons name="menu-book" size={28} color={Colors.onPrimary} />
          </View>
          <Text style={styles.logoText}>Tofu</Text>
        </View>

        {/* Hero area */}
        <View style={styles.heroCard}>
          <View style={styles.heroGradient} />
          <Text style={styles.heroText}>Nurture your mind.</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Log in to your reading sanctuary</Text>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            placeholder="hello@example.com"
            placeholderTextColor={`${Colors.onSurfaceVariant}66`}
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
          <View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={`${Colors.onSurfaceVariant}66`}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSignIn}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Start Reading</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign up link */}
        <View style={styles.signUpRow}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Quote */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            "Reading is a conversation. All books talk. But a good book listens as well."
          </Text>
          <Text style={styles.quoteAuthor}>— Mark Levy</Text>
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...Typography.styles.headlineMd,
    color: Colors.primary,
  },
  heroCard: {
    height: 160,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryContainer,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: Spacing.gutter,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${Colors.primary}66`,
  },
  heroText: {
    ...Typography.styles.displayLgMobile,
    color: Colors.onPrimary,
  },
  heading: {
    ...Typography.styles.headlineMd,
    color: Colors.onSurface,
  },
  subheading: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: -Spacing.stackSm,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    ...Typography.styles.labelSm,
    color: Colors.primary,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 14,
    ...Typography.styles.bodyMd,
    color: Colors.onSurface,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...Typography.styles.labelLg,
    color: Colors.onPrimary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.gutter,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.outlineVariant,
  },
  dividerText: {
    ...Typography.styles.labelSm,
    color: `${Colors.onSurfaceVariant}99`,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    ...Typography.styles.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  signUpLink: {
    ...Typography.styles.labelLg,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  quoteBox: {
    backgroundColor: `${Colors.surfaceContainerLow}88`,
    borderRadius: Radius.xl,
    padding: Spacing.stackMd,
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  quoteText: {
    ...Typography.styles.titleSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  quoteAuthor: {
    ...Typography.styles.labelSm,
    color: Colors.primary,
    marginTop: Spacing.base,
    letterSpacing: 2,
  },
});
