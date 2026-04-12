import React, { useState } from 'react';
import { TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { View, Text } from '../../src/tw';
import { supabase } from '../../src/services/supabase';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    
    // 1. Sign up to Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      Alert.alert('Registration Failed', authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Create entry in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username,
          email,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        Alert.alert('Warning', 'Account created but profile setup failed.');
      }
      
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/auth/login');
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-echo-bg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 justify-center">
        <View className="mb-10 mt-10">
          <Text className="text-white text-4xl font-bold tracking-tight">Tham gia Echo,</Text>
          <Text className="text-echo-gray text-lg mt-2">Bắt đầu gửi những lời thì thầm đầu tiên.</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-echo-gray mb-2 ml-1">Tên người dùng</Text>
            <TextInput
              placeholder="username"
              placeholderTextColor="#666"
              className="bg-echo-card text-white p-5 rounded-2xl border border-white/5"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View className="mt-4">
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
          onPress={handleRegister}
          disabled={loading}
          className="bg-echo-primary mt-10 p-5 rounded-2xl items-center shadow-lg shadow-echo-primary/20"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Đăng ký</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8 mb-10">
          <Text className="text-echo-gray">Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-echo-primary font-bold">Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
