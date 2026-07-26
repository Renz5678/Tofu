import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Typography, Spacing } from '@/theme';
import { supabase } from '@/lib/supabase';
import { GlobalSessionBanner } from '@/components/GlobalSessionBanner';

type TabIconProps = {
  name: keyof typeof MaterialIcons.glyphMap;
  label: string;
  focused: boolean;
};

function TabIcon({ name, label, focused }: TabIconProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <MaterialIcons
        name={name}
        size={24}
        color={focused ? colors.activeTab : colors.inactiveTab}
        style={{ opacity: focused ? 1 : 0.6 }}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.activeTab : colors.inactiveTab, opacity: focused ? 1 : 0.6 },
          focused && { fontWeight: '600' },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Guard: redirect to auth if no session, or to profile-setup if needed
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/(auth)/sign-in');
      } else if (!session.user.user_metadata?.has_set_profile) {
        router.replace('/(auth)/pick-username');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/(auth)/sign-in');
      } else if (session && !session.user.user_metadata?.has_set_profile) {
        // Handle immediate login after Google auth
        router.replace('/(auth)/pick-username');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.tabBarBorder,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="home" label="Home" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="import-contacts" label="Library" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="search" label="Search" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="dynamic-feed" label="Feed" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon name="leaderboard" label="Stats" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <GlobalSessionBanner />
    </>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    tabItem: {
      width: 72,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      gap: 2,
    },
    tabItemActive: {
      backgroundColor: colors.secondaryContainer,
    },
    tabLabel: {
      ...Typography.styles.labelSm,
      fontSize: 10,
      textAlign: 'center',
    },
  });
