import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-client';
import Constants from 'expo-constants';

// These should be set in your app.config.ts or .env file
// Using placeholders if not found in Constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://ydxrzfqfwrltouaefvuj.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'sb_publishable_T_H2hy6VFRgWtwjx_XZzwA_c8caNlUM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
