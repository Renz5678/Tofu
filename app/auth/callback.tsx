import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme, Typography, Spacing } from '@/theme';

export default function AuthCallback() {
  const router = useRouter();
  const { colors } = useTheme();
  const urlStr = useURL();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      if (!urlStr) return;

      try {
        const paramStr = urlStr.split('#')[1] || urlStr.split('?')[1] || '';

        const queryParams: Record<string, string> = {};
        paramStr.split('&').forEach((pair) => {
          const [key, val] = pair.split('=');
          if (key && val) queryParams[key] = decodeURIComponent(val);
        });

        const access_token = queryParams['access_token'];
        const refresh_token = queryParams['refresh_token'];
        const error_description = queryParams['error_description'];

        if (error_description) {
          throw new Error(error_description.replace(/\+/g, ' '));
        }

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;

          router.replace('/(tabs)/dashboard');
        } else {
          // If there's no token, we just send them to sign-in
          router.replace('/(auth)/sign-in');
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    }

    handleAuthCallback();
  }, [urlStr]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {errorMsg ? (
        <Text style={[styles.errorText, { color: colors.error ?? '#ef4444' }]}>{errorMsg}</Text>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { color: colors.onSurfaceVariant }]}>
            Verifying your email...
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.containerPadding,
  },
  text: {
    ...Typography.styles.bodyMd,
    marginTop: Spacing.base,
  },
  errorText: {
    ...Typography.styles.bodyMd,
    textAlign: 'center',
  },
});
