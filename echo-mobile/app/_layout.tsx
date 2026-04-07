import '../src/global.css';
import { Stack } from 'expo-router';
import { View, Text } from '../src/tw';
import { useEffect } from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
