import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/theme';
import { useSessionStore } from '@/store/sessionStore';
import { AppState, AppStateStatus } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

/**
 * Font loading strategy: we use expo-font with inline require() for bundled
 * assets. Fonts are placed in assets/fonts/. If fonts fail to load, the app
 * falls back to system fonts gracefully (fontError check below).
 *
 * The theme/tokens.ts font families must match exactly the keys below.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Literata — Serif display font (used for book titles, major headings)
    Literata_400Regular: require('../assets/fonts/Literata-Regular.ttf'),
    Literata_600SemiBold: require('../assets/fonts/Literata-SemiBold.ttf'),
    Literata_700Bold: require('../assets/fonts/Literata-Bold.ttf'),
    // Hanken Grotesk — Sans-serif UI font (labels, body, data)
    HankenGrotesk_400Regular: require('../assets/fonts/HankenGrotesk-Regular.ttf'),
    HankenGrotesk_500Medium: require('../assets/fonts/HankenGrotesk-Medium.ttf'),
    HankenGrotesk_600SemiBold: require('../assets/fonts/HankenGrotesk-SemiBold.ttf'),
    HankenGrotesk_700Bold: require('../assets/fonts/HankenGrotesk-Bold.ttf'),
  });

  const hydrateFromStorage = useSessionStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        useSessionStore.getState().pauseSession();
      } else if (nextAppState === 'active') {
        useSessionStore.getState().resumeSession();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="book/[id]"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="session/active"
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="session/finish"
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="favorites/index" />
            <Stack.Screen name="tier-lists/index" />
            <Stack.Screen name="tier-lists/[id]" />
            <Stack.Screen name="playlists/index" />
            <Stack.Screen name="playlists/[id]" />
            <Stack.Screen name="goals/index" />
            <Stack.Screen name="share/[type]/[id]" />
          </Stack>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
