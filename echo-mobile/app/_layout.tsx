import '../src/global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text } from '../src/tw';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/services/supabase';

export default function RootLayout() {
  const { setSession, session, initialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Listen for auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'auth';
    const isIndex = segments.length === 0 || segments[0] === 'index';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (session && (inAuthGroup || isIndex)) {
      // Redirect to chat if already authenticated
      router.replace('/(tabs)/chat');
    }
  }, [session, initialized, segments]);

  if (!initialized) {
    return (
      <View className="flex-1 bg-echo-bg items-center justify-center">
        <Text className="text-white">Loading Echo...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
