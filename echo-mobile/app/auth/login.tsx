import React, { useState } from 'react';
import { TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { View, Text } from '../../src/tw';
import { supabase } from '../../src/services/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(tabs)/chat' as any);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-echo-bg"
    >
      <View className="flex-1 px-8 justify-center">
        <View className="mb-12">
          <Text className="text-white text-5xl font-bold tracking-tight">Chào bạn,</Text>
          <Text className="text-echo-gray text-lg mt-2">Đăng nhập để tiếp tục trải nghiệm Echo.</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-echo-gray mb-2 ml-1">Email</Text>
            <TextInput
              placeholder="your@email.com"
              placeholderTextColor="#666"
              className="bg-echo-card text-white p-5 rounded-2xl border border-white/5"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mt-4">
            <Text className="text-echo-gray mb-2 ml-1">Mật khẩu</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry
              className="bg-echo-card text-white p-5 rounded-2xl border border-white/5"
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogin}
          disabled={loading}
          className="bg-echo-primary mt-10 p-5 rounded-2xl items-center shadow-lg shadow-echo-primary/20"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-echo-gray">Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text className="text-echo-primary font-bold">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
