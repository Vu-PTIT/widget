import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, UserPlus, Moon, Volume2, Palette, Users, User as UserIcon, Mic, Square, Check, X, Send, Play, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore, User, Message, Story } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';
import React from 'react';
import { ChatInputBar } from '../components/ChatInputBar';

const VOICE_EFFECTS = [
  { id: 'normal', icon: '🎤', label: 'Bình thường' },
  { id: 'chipmunk', icon: '🐿️', label: 'Sóc chuột' },
  { id: 'robot', icon: '🤖', label: 'Người máy' },
  { id: 'deep', icon: '👹', label: 'Giọng trầm' },
  { id: 'echo', icon: '🗣️', label: 'Tiếng vang' },
];

export default function Home() {
  const { currentUser, friends, allMessages, stories, soundboard, appTheme } = useStore(useShallow(state => ({
    currentUser: state.currentUser,
    friends: state.friends,
    allMessages: state.messages,
    stories: state.stories,
    soundboard: state.widgetConfig.soundboard,
    appTheme: state.settings.appTheme
  })));
  const addMessage = useStore(state => state.addMessage);
  const addStory = useStore(state => state.addStory);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');
  const [isRecordingStory, setIsRecordingStory] = useState(false);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);

  const [pendingMessage, setPendingMessage] = useState<{type: 'voice', duration: number, voiceEffect?: string} | {type: 'soundboard', content: string} | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isSoundboardExpanded, setIsSoundboardExpanded] = useState(false);

  const individualFriends = friends.filter(f => f.type !== 'group');
  const groups = friends.filter(f => f.type === 'group');

  const displayItems = activeTab === 'friends' ? individualFriends : groups;

  const handleCancelRecording = () => {
    setPendingMessage(null);
    setSelectedRecipients([]);
  };

  const handleSendBroadcast = () => {
    if (selectedRecipients.length === 0 || !pendingMessage) return;
    
    selectedRecipients.forEach(receiverId => {
      addMessage({
        id: Date.now().toString() + Math.random().toString(),
        senderId: currentUser!.id,
        receiverId,
        type: pendingMessage.type,
        content: pendingMessage.type === 'soundboard' ? pendingMessage.content : 'voice_url',
        duration: pendingMessage.type === 'voice' ? pendingMessage.duration : undefined,
        voiceEffect: pendingMessage.type === 'voice' ? pendingMessage.voiceEffect : undefined,
        timestamp: Date.now()
      });
    });
    
    setPendingMessage(null);
    setSelectedRecipients([]);
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  return (
    <div className={cn("h-full flex flex-col p-6 relative transition-colors duration-500", appTheme)}>
      {/* Header */}
      <header className="flex items-center justify-between mb-6 pt-4 shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src={currentUser?.avatar} 
            alt="Me" 
            className="w-12 h-12 rounded-full bg-neutral-800 cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-pink-500" 
            onClick={() => navigate('/settings')}
          />
          <div>
            <h2 className="font-bold text-lg">{currentUser?.name}</h2>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/studio')} className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            <Palette size={20} />
          </button>
          <button onClick={() => navigate('/add-friend')} className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            <UserPlus size={20} />
          </button>
        </div>
      </header>

      {/* Stories Section */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 ml-1">Tin mới</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setIsRecordingStory(true)}
            className="flex flex-col items-center gap-2 shrink-0"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center border-2 border-neutral-800 hover:border-pink-500 transition-colors">
              <Plus size={24} className="text-neutral-500" />
            </div>
            <span className="text-[10px] text-neutral-400">Đăng tin</span>
          </button>
          {stories.map(story => (
            <StoryCircle key={story.id} story={story} onClick={() => setViewingStory(story)} />
          ))}
        </div>
      </div>

      {isRecordingStory && (
        <RecordStoryModal 
          onClose={() => setIsRecordingStory(false)} 
          onSave={(duration, voiceEffect) => {
            addStory({ id: Date.now().toString(), userId: currentUser!.id, audioUrl: 'voice_url', duration, voiceEffect, timestamp: Date.now() });
            setIsRecordingStory(false);
          }} 
        />
      )}

      {viewingStory && (
        <ViewStoryModal 
          story={viewingStory} 
          onClose={() => setViewingStory(null)} 
          onReply={(duration, voiceEffect) => {
            addMessage({
              id: Date.now().toString(),
              senderId: currentUser!.id,
              receiverId: viewingStory.userId,
              type: 'voice',
              content: 'voice_url',
              duration,
              voiceEffect,
              timestamp: Date.now()
            });
            setViewingStory(null);
          }}
        />
      )}

      {/* Lists Container */}
      <div className="flex-1 overflow-y-auto pb-4 -mx-2 px-2 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'friends' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'friends' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {displayItems.map((item, idx) => {
              const friendMessages = allMessages.filter(m => 
                (m.senderId === item.id && m.receiverId === currentUser?.id) || 
                (m.senderId === currentUser?.id && m.receiverId === item.id)
              );
              const latestMessage = friendMessages[friendMessages.length - 1];
              
              return (
                <FriendCard 
                  key={item.id} 
                  friend={item} 
                  index={idx} 
                  selectionMode={!!pendingMessage}
                  isSelected={selectedRecipients.includes(item.id)}
                  onClick={() => pendingMessage ? toggleRecipient(item.id) : navigate(`/chat/${item.id}`)} 
                  latestMessage={latestMessage}
                />
              );
            })}
            
            {activeTab === 'friends' ? (
              <motion.button 
                onClick={() => navigate('/add-friend')}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: individualFriends.length * 0.1 }}
                className="rounded-2xl border-2 border-dashed border-neutral-800 p-4 flex items-center gap-4 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors"
              >
                <div className="w-14 h-14 shrink-0 rounded-full bg-neutral-900 flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <span className="font-medium text-base">Mời thêm bạn bè</span>
              </motion.button>
            ) : (
              <motion.button 
                onClick={() => navigate('/create-group')}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: groups.length * 0.1 }}
                className="rounded-2xl border-2 border-dashed border-neutral-800 p-4 flex items-center gap-4 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors"
              >
                <div className="w-14 h-14 shrink-0 rounded-full bg-neutral-900 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <span className="font-medium text-base">Tạo nhóm mới</span>
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Record / Send Area */}
      <div className="mt-auto shrink-0 -mx-6 -mb-6 relative z-40">
        <AnimatePresence mode="wait">
          {!pendingMessage ? (
            <motion.div 
              key="record"
              exit={{ opacity: 0, y: 20 }}
            >
              <ChatInputBar 
                onSendVoice={(duration, voiceEffect) => setPendingMessage({ type: 'voice', duration, voiceEffect })}
                onSendSound={(id) => setPendingMessage({ type: 'soundboard', content: id })}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="send"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-neutral-900 rounded-t-[2rem] border-t border-neutral-800 flex flex-col items-center gap-4"
            >
              <div className="text-xs font-medium text-pink-500 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 flex items-center gap-2">
                {pendingMessage.type === 'soundboard' ? (
                  <span>Chọn người nhận âm thanh {soundboard.find(s => s.id === pendingMessage.content)?.icon}</span>
                ) : (
                  <span>Chọn người nhận tin nhắn thoại</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCancelRecording} 
                  className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors shadow-lg"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={handleSendBroadcast}
                  disabled={selectedRecipients.length === 0}
                  className="px-6 h-12 rounded-full bg-pink-500 text-white font-bold flex items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all shadow-lg"
                >
                  <Send size={18} />
                  Gửi ({selectedRecipients.length})
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Footer */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[280px] bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-1.5 rounded-full flex items-center gap-1 shadow-2xl z-50">
        <button
          onClick={() => setActiveTab('friends')}
          className={cn(
            "flex-1 py-3 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2",
            activeTab === 'friends' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <UserIcon size={18} />
          Bạn bè
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={cn(
            "flex-1 py-3 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2",
            activeTab === 'groups' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <Users size={18} />
          Nhóm
        </button>
      </div>
    </div>
  );
}

const FriendCard: React.FC<{ friend: User, index: number, onClick: () => void, selectionMode?: boolean, isSelected?: boolean, latestMessage?: Message }> = ({ friend, index, onClick, selectionMode, isSelected, latestMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlayVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    
    setIsPlaying(true);
    // Simulate playing duration
    setTimeout(() => {
      setIsPlaying(false);
    }, (latestMessage?.duration || 2) * 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl bg-neutral-900 p-4 flex items-center gap-4 cursor-pointer hover:bg-neutral-800 transition-all group",
        isSelected && "ring-2 ring-pink-500 bg-neutral-800"
      )}
    >
      <div className="relative shrink-0">
        <img src={friend.avatar} alt={friend.name} className="w-14 h-14 rounded-full bg-neutral-800" />
        
        {!selectionMode && <StatusIndicator status={friend.status} />}
        {selectionMode && (
          <div className={cn(
            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-neutral-900 flex items-center justify-center transition-colors",
            isSelected ? "bg-pink-500" : "bg-neutral-700"
          )}>
            {isSelected && <Check size={10} className="text-white" />}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-neutral-200 group-hover:text-white transition-colors truncate">{friend.nickname || friend.name}</span>
            {friend.streak && friend.streak > 0 && (
                <div className="flex items-center gap-1 text-orange-500 font-bold text-xs">
                <span>🔥</span>
                <span>{friend.streak}</span>
                </div>
            )}
        </div>
        <div className="text-sm text-neutral-500 truncate">
            {latestMessage ? (
                latestMessage.type === 'voice' ? (
                  <span className="flex items-center gap-1">
                    {latestMessage.voiceEffect && latestMessage.voiceEffect !== 'normal' 
                      ? VOICE_EFFECTS.find(e => e.id === latestMessage.voiceEffect)?.icon 
                      : '🎤'} Tin nhắn thoại
                  </span>
                ) : '🎵 Âm thanh'
            ) : (
                'Chưa có tin nhắn'
            )}
        </div>
      </div>
      
      {!selectionMode && latestMessage?.type === 'voice' && (
        <button 
          onClick={handlePlayVoice}
          className="w-10 h-10 shrink-0 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
        >
          {isPlaying ? <Square size={16} className="fill-white" /> : <Play size={16} className="fill-white ml-0.5" />}
        </button>
      )}
    </motion.div>
  );
};

const StoryCircle: React.FC<{ story: Story, onClick?: () => void }> = ({ story, onClick }) => {
  const user = useStore(state => state.friends.find(f => f.id === story.userId) || state.currentUser);
  
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-orange-500 animate-spin-slow">
        <img 
          src={user?.avatar} 
          alt={user?.name} 
          className="w-full h-full rounded-full bg-neutral-800 border-2 border-neutral-950" 
        />
      </div>
      <span className="text-[10px] text-neutral-400 truncate w-16 text-center">{user?.name}</span>
    </button>
  );
};

const ViewStoryModal: React.FC<{ story: Story, onClose: () => void, onReply: (duration: number, voiceEffect: string) => void }> = ({ story, onClose, onReply }) => {
  const user = useStore(state => state.friends.find(f => f.id === story.userId) || state.currentUser);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedVoiceEffect, setSelectedVoiceEffect] = useState('normal');
  const [showVoiceEffects, setShowVoiceEffects] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            clearInterval(progressTimerRef.current!);
            return 100;
          }
          return p + (100 / (story.duration * 10)); // Update every 100ms
        });
      }, 100);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, story.duration]);

  const handleStart = () => {
    setIsPlaying(false);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 10) {
          handleStop();
          return 10;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStop = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordingTime > 0) {
        onReply(recordingTime, selectedVoiceEffect);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black">
      {/* Progress Bar */}
      <div className="h-1 w-full bg-neutral-800 absolute top-0 left-0 z-10">
        <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full bg-neutral-800" />
          <div>
            <div className="font-bold text-white">{user?.name}</div>
            <div className="text-xs text-neutral-400">
              {story.voiceEffect && story.voiceEffect !== 'normal' && (
                <span className="mr-1">{VOICE_EFFECTS.find(e => e.id === story.voiceEffect)?.icon}</span>
              )}
              {story.duration}s
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-md">
          <X size={20} />
        </button>
      </div>

      {/* Center Content (Play/Pause) */}
      <div className="flex-1 flex items-center justify-center relative" onClick={() => setIsPlaying(!isPlaying)}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />
        
        {/* Visualizer */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ height: isPlaying ? [10, Math.max(20, Math.random() * 80), 10] : 10 }}
              transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
              className="w-2 rounded-full bg-white/80"
            />
          ))}
        </div>

        {!isPlaying && progress < 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Play size={48} className="text-white fill-white opacity-80" />
          </div>
        )}
      </div>

      {/* Footer (Reply) */}
      <div className="p-6 pb-10 z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center shrink-0">
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.2 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 bg-pink-500 rounded-full"
                />
              )}
            </AnimatePresence>
            <button
              onMouseDown={handleStart}
              onMouseUp={handleStop}
              onMouseLeave={handleStop}
              onTouchStart={handleStart}
              onTouchEnd={handleStop}
              className={cn(
                "relative w-16 h-16 rounded-full flex items-center justify-center transition-all z-10",
                isRecording ? "bg-pink-500 scale-110 shadow-[0_0_30px_rgba(236,72,153,0.5)]" : "bg-white/20 hover:bg-white/30 backdrop-blur-md"
              )}
            >
              {isRecording ? <Square size={24} className="text-white fill-white" /> : <Mic size={28} className="text-white" />}
            </button>
          </div>

          {isRecording ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 h-16"
            >
              <div className="flex items-center gap-1 flex-1 overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ height: [4, Math.max(8, Math.random() * 32), 4] }}
                    transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
                    className="w-1 rounded-full bg-pink-500"
                  />
                ))}
              </div>
              <span className="text-sm font-mono font-bold text-pink-500">
                00:{recordingTime.toString().padStart(2, '0')}
              </span>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-between bg-white/10 backdrop-blur-md rounded-full px-6 py-3 h-16 relative">
              <span className="text-white/70">Nhấn giữ để trả lời...</span>
              
              <AnimatePresence>
                {showVoiceEffects && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="absolute bottom-full right-0 mb-4 bg-neutral-800 border border-neutral-700 rounded-2xl p-2 flex flex-col gap-1 shadow-xl z-50"
                  >
                    {VOICE_EFFECTS.map(effect => (
                      <button
                        key={effect.id}
                        onClick={() => {
                          setSelectedVoiceEffect(effect.id);
                          setShowVoiceEffects(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left min-w-[160px]",
                          selectedVoiceEffect === effect.id ? "bg-pink-500/20 text-pink-500" : "hover:bg-neutral-700 text-white"
                        )}
                      >
                        <span className="text-xl">{effect.icon}</span>
                        <span className="font-medium text-sm">{effect.label}</span>
                        {selectedVoiceEffect === effect.id && <Check size={16} className="ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setShowVoiceEffects(!showVoiceEffects)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all shrink-0",
                  showVoiceEffects ? "bg-pink-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                )}
              >
                {VOICE_EFFECTS.find(e => e.id === selectedVoiceEffect)?.icon || '🎤'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RecordStoryModal: React.FC<{ onClose: () => void, onSave: (duration: number, voiceEffect: string) => void }> = ({ onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedVoiceEffect, setSelectedVoiceEffect] = useState('normal');
  const [showVoiceEffects, setShowVoiceEffects] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 10) {
          handleStop();
          return 10;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStop = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordingTime > 0) {
        onSave(recordingTime, selectedVoiceEffect);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-neutral-900 w-full max-w-sm rounded-[2rem] p-6 border border-neutral-800 shadow-2xl flex flex-col items-center relative">
            <h3 className="text-xl font-bold text-white mb-6">Ghi âm tin mới</h3>
            
            <AnimatePresence>
              {showVoiceEffects && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-neutral-800 border border-neutral-700 rounded-2xl p-2 flex flex-col gap-1 shadow-xl z-50"
                >
                  {VOICE_EFFECTS.map(effect => (
                    <button
                      key={effect.id}
                      onClick={() => {
                        setSelectedVoiceEffect(effect.id);
                        setShowVoiceEffects(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left min-w-[160px]",
                        selectedVoiceEffect === effect.id ? "bg-pink-500/20 text-pink-500" : "hover:bg-neutral-700 text-white"
                      )}
                    >
                      <span className="text-xl">{effect.icon}</span>
                      <span className="font-medium text-sm">{effect.label}</span>
                      {selectedVoiceEffect === effect.id && <Check size={16} className="ml-auto" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex items-center justify-center">
                  {isRecording && (
                      <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0.2 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="absolute inset-0 bg-pink-500 rounded-full"
                      />
                  )}
                  <button
                      onMouseDown={handleStart}
                      onMouseUp={handleStop}
                      onMouseLeave={handleStop}
                      onTouchStart={handleStart}
                      onTouchEnd={handleStop}
                      className={cn(
                          "relative w-24 h-24 rounded-full flex items-center justify-center transition-all z-10",
                          isRecording ? "bg-pink-500 scale-110 shadow-[0_0_30px_rgba(236,72,153,0.5)]" : "bg-pink-500 shadow-lg"
                      )}
                  >
                      {isRecording ? <Square size={32} className="text-white fill-white" /> : <Mic size={40} className="text-white" />}
                  </button>
              </div>

              {!isRecording && (
                <button 
                  onClick={() => setShowVoiceEffects(!showVoiceEffects)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shrink-0 shadow-lg",
                    showVoiceEffects ? "bg-pink-500 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
                  )}
                >
                  {VOICE_EFFECTS.find(e => e.id === selectedVoiceEffect)?.icon || '🎤'}
                </button>
              )}
            </div>
            <p className="text-neutral-400 mb-6 font-mono">00:{recordingTime.toString().padStart(2, '0')}</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-700">Hủy</button>
        </div>
    </div>
  );
};

const SoundboardModal: React.FC<{ onClose: () => void, onSelect: (id: string) => void }> = ({ onClose, onSelect }) => {
  const soundboard = useStore(state => state.widgetConfig.soundboard);
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="bg-neutral-900 w-full max-w-sm rounded-[2rem] p-6 border border-neutral-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        >
            <h3 className="text-xl font-bold text-white mb-6">Soundboard</h3>
            <div className="grid grid-cols-5 gap-4">
                {soundboard.map(sound => (
                    <button 
                        key={sound.id}
                        onClick={() => onSelect(sound.id)}
                        className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-xl hover:bg-neutral-700 hover:scale-110 transition-all active:scale-95 shadow-lg"
                    >
                        {sound.icon}
                    </button>
                ))}
            </div>
            <button onClick={onClose} className="w-full mt-6 py-3 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-700">Đóng</button>
        </motion.div>
    </div>
  );
};

function StatusIndicator({ status }: { status: User['status'] }) {
  if (status === 'sleep') {
    return (
      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-500 rounded-full border-4 border-neutral-900 flex items-center justify-center">
        <Moon size={12} className="text-white fill-white" />
      </div>
    );
  }
  if (status === 'listening') {
    return (
      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-pink-500 rounded-full border-4 border-neutral-900 flex items-center justify-center">
        <Volume2 size={12} className="text-white" />
      </div>
    );
  }
  return (
    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-neutral-900" />
  );
}
