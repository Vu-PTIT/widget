import { create } from 'zustand';

export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: 'online' | 'sleep' | 'listening';
  type?: 'friend' | 'group';
  nickname?: string;
  streak?: number;
  members?: string[];
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  type: 'voice' | 'soundboard';
  content: string; // URL or sound ID
  duration?: number;
  voiceEffect?: string;
  timestamp: number;
};

export type Story = {
  id: string;
  userId: string;
  audioUrl: string;
  duration: number;
  voiceEffect?: string;
  timestamp: number;
};

export type SoundboardItem = {
  id: string;
  icon: string;
  name: string;
  soundUrl: string;
};

interface AppState {
  currentUser: User | null;
  friends: User[];
  messages: Message[];
  stories: Story[];
  widgetConfig: {
    theme: string;
    soundboard: SoundboardItem[];
  };
  settings: {
    sleepMode: boolean;
    raiseToListen: boolean;
    hapticFeedback: 'heartbeat' | 'intense' | 'gentle';
    appTheme: string;
  };
  login: (user: User) => void;
  updateProfile: (updates: Partial<User>) => void;
  updateFriend: (id: string, updates: Partial<User>) => void;
  addMessage: (msg: Message) => void;
  addFriend: (friend: User) => void;
  removeFriend: (id: string) => void;
  updateWidgetConfig: (config: Partial<AppState['widgetConfig']>) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  addStory: (story: Story) => void;
}

const MOCK_FRIENDS: User[] = [
  { id: '1', name: 'Bảo Hân', username: 'baohan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Han', status: 'online', type: 'friend', streak: 5 },
  { id: '2', name: 'Tuấn Kiệt', username: 'tuankiet', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kiet', status: 'sleep', type: 'friend', streak: 12 },
  { id: '3', name: 'Hội Chị Em', username: 'hoichiem', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hoi', status: 'listening', type: 'group', streak: 0, members: ['1', '2'] },
];

const DEFAULT_SOUNDBOARD: SoundboardItem[] = [
  { id: 's1', icon: '🐱', name: 'Meow', soundUrl: '/sounds/meow.mp3' },
  { id: 's2', icon: '🤡', name: 'Bruh', soundUrl: '/sounds/bruh.mp3' },
  { id: 's3', icon: '🚪', name: 'Knock', soundUrl: '/sounds/knock.mp3' },
  { id: 's4', icon: '💨', name: 'Fart', soundUrl: '/sounds/fart.mp3' },
  { id: 's5', icon: '🥁', name: 'Drum', soundUrl: '/sounds/drum.mp3' },
  { id: 's6', icon: '🔔', name: 'Bell', soundUrl: '/sounds/bell.mp3' },
  { id: 's7', icon: '🤣', name: 'Laugh', soundUrl: '/sounds/laugh.mp3' },
  { id: 's8', icon: '😱', name: 'Scream', soundUrl: '/sounds/scream.mp3' },
  { id: 's9', icon: '👏', name: 'Clap', soundUrl: '/sounds/clap.mp3' },
  { id: 's10', icon: '🎵', name: 'Music', soundUrl: '/sounds/music.mp3' },
];

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  friends: MOCK_FRIENDS,
  messages: [],
  stories: [],
  widgetConfig: {
    theme: 'bg-pink-500',
    soundboard: DEFAULT_SOUNDBOARD,
  },
  settings: {
    sleepMode: false,
    raiseToListen: true,
    hapticFeedback: 'heartbeat',
    appTheme: 'bg-neutral-950',
  },
  login: (user) => set({ currentUser: user }),
  updateProfile: (updates) => set((state) => ({ 
    currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null 
  })),
  updateFriend: (id, updates) => set((state) => ({
    friends: state.friends.map(f => f.id === id ? { ...f, ...updates } : f)
  })),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  addStory: (story) => set((state) => ({ stories: [...state.stories, story] })),
  addFriend: (friend) => set((state) => ({ friends: [...state.friends, friend] })),
  removeFriend: (id) => set((state) => ({ friends: state.friends.filter(f => f.id !== id) })),
  updateWidgetConfig: (config) => set((state) => ({ widgetConfig: { ...state.widgetConfig, ...config } })),
  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
}));
