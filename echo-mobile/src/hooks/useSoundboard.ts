import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { supabase } from '../services/supabase';

export const useSoundboard = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSoundboard();
  }, []);

  const fetchSoundboard = async () => {
    const { data, error } = await supabase
      .from('soundboard_items')
      .select('*');
    
    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const playSound = async (soundUrl: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true }
      );
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing sound', error);
    }
  };

  return {
    items,
    loading,
    playSound,
  };
};

export const playLocalSound = async (asset: any) => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      asset,
      { shouldPlay: true }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Error playing local sound', error);
  }
};
