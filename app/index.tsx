import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      if (session && !session.user.user_metadata?.has_set_profile) {
        setNeedsProfile(true);
      }
      setChecking(false);
    });
  }, []);

  if (checking) return null;

  if (hasSession) {
    return needsProfile ? (
      <Redirect href="/(auth)/pick-username" />
    ) : (
      <Redirect href="/(tabs)/dashboard" />
    );
  }

  return <Redirect href="/(auth)/sign-in" />;
}
