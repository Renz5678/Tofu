import { useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { validateUsernameFormat } from '@/hooks/useUsernameCheck';

WebBrowser.maybeCompleteAuthSession(); // Required for web redirects

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithGoogle() {
    setLoading(true);
    try {
      // 1. Generate the local deep-link URL (e.g. tofu://auth/callback)
      const redirectUrl = makeRedirectUri({
        scheme: 'tofu',
        path: 'auth/callback',
      });

      // 2. Ask Supabase to generate the Google OAuth URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We will handle the redirect manually
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

      // 3. Open the Google auth page in an in-app browser sheet
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      // 4. When the user finishes, Google redirects back to Supabase,
      //    which redirects back to tofu://auth/callback#access_token=...
      if (result.type === 'success' && result.url) {
        // Parse the URL (Linking handles both ?query and #fragment params)
        const parsedUrl = Linking.parse(result.url);
        
        // Sometimes the params are tucked inside parsedUrl.queryParams
        // but if there's a fragment, Expo linking might not parse it perfectly in all versions.
        // Let's use URLSearchParams to be absolutely safe with fragments:
        const urlStr = result.url;
        const paramStr = urlStr.split('#')[1] || urlStr.split('?')[1] || '';
        
        // Simple manual parser just in case URLSearchParams isn't fully polyfilled
        const queryParams: Record<string, string> = {};
        paramStr.split('&').forEach(pair => {
          const [key, val] = pair.split('=');
          if (key && val) queryParams[key] = decodeURIComponent(val);
        });

        const access_token = queryParams['access_token'];
        const refresh_token = queryParams['refresh_token'];
        const error_description = queryParams['error_description'];

        if (error_description) {
          throw new Error(error_description);
        }

        if (access_token && refresh_token) {
          // Tell Supabase to establish the session
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;

          // Check if this user needs to pick a username
          if (sessionData.session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', sessionData.session.user.id)
              .single();

            if (!profile?.username || !validateUsernameFormat(profile.username)) {
              router.replace('/(auth)/pick-username');
            } else {
              router.replace('/(tabs)/dashboard');
            }
          }
        } else {
          throw new Error('Authentication failed (no tokens returned).');
        }
      }
    } catch (e: any) {
      console.warn('[Google Auth Error]', e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { signInWithGoogle, loading };
}
