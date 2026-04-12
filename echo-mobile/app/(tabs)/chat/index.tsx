import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { View, Text } from '../../../src/tw';
import { supabase } from '../../../src/services/supabase';
import { useAuthStore } from '../../../src/store/authStore';
import { useAudioRecorder } from '../../../src/hooks/useAudioRecorder';
import { useSoundboard } from '../../../src/hooks/useSoundboard';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

export default function ChatScreen() {
  const { user } = useAuthStore();
  const { isRecording, duration, startRecording, stopRecording } = useAudioRecorder();
  const { playSound } = useSoundboard();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        setMessages(current => [payload.new, ...current]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(username, avatar)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const playMessage = async (url: string, id: string) => {
    try {
      setCurrentlyPlaying(id);
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setCurrentlyPlaying(null);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Playback error', error);
      setCurrentlyPlaying(null);
    }
  };

  const handleSendAudio = async () => {
    // Play a "hiss" sound or subtle echo when stopping recording
    // playSound('https://example.com/echo_out.mp3'); 

    const result = await stopRecording();
    if (!result || !user) return;

    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}.m4a`;
      const base64 = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.Base64 });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-messages')
        .upload(fileName, decode(base64), { contentType: 'audio/m4a' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('audio-messages')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: '00000000-0000-0000-0000-000000000000', // Placeholder for "global" or peer
          audio_url: publicUrlData.publicUrl,
          audio_path: fileName,
          duration: result.duration,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      if (dbError) throw dbError;

    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className={`mb-4 max-w-[80%] ${item.sender_id === user?.id ? 'self-end' : 'self-start'}`}>
      <TouchableOpacity 
        onPress={() => playMessage(item.audio_url, item.id)}
        className={`p-4 rounded-3xl ${item.sender_id === user?.id ? 'bg-echo-primary' : 'bg-echo-card'}`}
      >
        <View className="flex-row items-center space-x-3">
          <Ionicons 
            name={currentlyPlaying === item.id ? "pause-circle" : "play-circle"} 
            size={33} 
            color="white" 
          />
          <Text className="text-white font-medium">{item.duration}s</Text>
        </View>
      </TouchableOpacity>
      <Text className="text-echo-gray text-xs mt-1 ml-2">
        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-echo-bg pt-12">
      <View className="px-6 flex-row justify-between items-center mb-6">
        <Text className="text-white text-3xl font-bold">Echoes</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        inverted
      />

      <View className="absolute bottom-10 left-0 right-0 items-center">
        {isRecording && (
          <View className="mb-4 bg-red-500/10 px-4 py-2 rounded-full flex-row items-center">
            <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
            <Text className="text-red-500 font-bold">Recording: {duration}s</Text>
          </View>
        )}
        
        <TouchableOpacity
          onPressIn={startRecording}
          onPressOut={handleSendAudio}
          disabled={uploading}
          className={`w-20 h-20 rounded-full items-center justify-center shadow-2xl ${isRecording ? 'bg-red-500' : 'bg-echo-primary'}`}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
