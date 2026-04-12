import { Tabs } from 'expo-router';
import { View } from '../../src/tw';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0D0D0D',
        borderTopWidth: 0,
        height: 60,
      },
      tabBarActiveTintColor: '#FF3B30',
      tabBarInactiveTintColor: '#666',
    }}>
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Echo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
