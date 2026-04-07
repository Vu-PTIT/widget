import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, UserPlus, Moon, Volume2, Palette, Users, User as UserIcon, Mic, Square, Check, X, Send, Play, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore, User, Message, Story } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';
import React from 'react';

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

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pendingMessage, setPendingMessage] = useState<{type: 'voice', duration: number} | {type: 'soundboard', content: string} | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isSoundboardExpanded, setIsSoundboardExpanded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const individualFriends = friends.filter(f => f.type !== 'group');
  const groups = friends.filter(f => f.type === 'group');

  const displayItems = activeTab === 'friends' ? individualFriends : groups;

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 10) {
          handleStopRecording();
          return 10;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (recordingTime > 0) {
      setPendingMessage({ type: 'voice', duration: recordingTime });
    }
  };

  const handleCancelRecording = () => {
    setPendingMessage(null);
    setSelectedRecipients([]);
    setRecordingTime(0);
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
        timestamp: Date.now()
      });
    });
    
    setPendingMessage(null);
    setSelectedRecipients([]);
    setRecordingTime(0);
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
            <StoryCircle key={story.id} story={story} />
          ))}
        </div>
      </div>

      {isRecordingStory && (
        <RecordStoryModal 
          onClose={() => setIsRecordingStory(false)} 
          onSave={(duration) => {
            addStory({ id: Date.now().toString(), userId: currentUser!.id, audioUrl: 'voice_url', duration, timestamp: Date.now() });
            setIsRecordingStory(false);
          }} 
        />
      )}

      {/* Lists Container */}
      <div className="flex-1 overflow-y-auto pb-48 -mx-2 px-2 scrollbar-hide">
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
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center w-full px-4">
        <AnimatePresence mode="wait">
          {!pendingMessage ? (
            <motion.div 
              key="record"
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="flex items-center justify-center gap-4"
            >
              {/* Soundboard */}
              <div className="relative">
                {isSoundboardExpanded && (
                  <SoundboardModal 
                    onClose={() => setIsSoundboardExpanded(false)} 
                    onSelect={(id) => {
                        setPendingMessage({ type: 'soundboard', content: id });
                        setIsSoundboardExpanded(false);
                    }} 
                  />
                )}
                <div className="flex gap-2 items-center">
                  <div className="flex gap-2">
                    {soundboard.slice(0, 3).map(sound => (
                      <button 
                        key={sound.id}
                        onClick={() => setPendingMessage({ type: 'soundboard', content: sound.id })}
                        className="w-12 h-12 flex-shrink-0 rounded-2xl bg-neutral-800 flex items-center justify-center text-xl hover:bg-neutral-700 hover:scale-110 transition-all active:scale-95 shadow-lg"
                      >
                        {sound.icon}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsSoundboardExpanded(!isSoundboardExpanded)}
                    className="w-12 h-12 flex-shrink-0 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all shadow-lg"
                  >
                    {isSoundboardExpanded ? <X size={20} /> : <span className="text-xl">+</span>}
                  </button>
                </div>
              </div>

              {/* Record Button */}
              <div className="relative flex items-center justify-center">
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
                  onMouseDown={handleStartRecording}
                  onMouseUp={handleStopRecording}
                  onMouseLeave={handleStopRecording}
                  onTouchStart={handleStartRecording}
                  onTouchEnd={handleStopRecording}
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg z-10",
                    isRecording ? "bg-pink-600 scale-90" : "bg-pink-500 hover:scale-105"
                  )}
                >
                  {isRecording ? <Square size={24} className="fill-white" /> : <Mic size={24} className="text-white" />}
                </button>
                {isRecording && (
                  <div className="absolute -top-8 font-mono text-pink-500 font-bold text-sm bg-neutral-900/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    00:{recordingTime.toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="send"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
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
        isSelected && "ring-2 ring-pink-500 bg-neutral-800",
        friend.streak && friend.streak > 10 && "ring-2 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
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
                latestMessage.type === 'voice' ? '🎤 Tin nhắn thoại' : '🎵 Âm thanh'
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

const StoryCircle: React.FC<{ story: Story }> = ({ story }) => {
  const user = useStore(state => state.friends.find(f => f.id === story.userId) || state.currentUser);
  
  return (
    <button className="flex flex-col items-center gap-2 shrink-0">
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

const RecordStoryModal: React.FC<{ onClose: () => void, onSave: (duration: number) => void }> = ({ onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
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
        onSave(recordingTime);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-neutral-900 w-full max-w-sm rounded-[2rem] p-6 border border-neutral-800 shadow-2xl flex flex-col items-center">
            <h3 className="text-xl font-bold text-white mb-6">Ghi âm tin mới</h3>
            <div className="relative flex items-center justify-center mb-6">
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
            <p className="text-neutral-400 mb-6 font-mono">00:{recordingTime.toString().padStart(2, '0')}</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-700">Hủy</button>
        </div>
    </div>
  );
};

const SoundboardModal: React.FC<{ onClose: () => void, onSelect: (id: string) => void }> = ({ onClose, onSelect }) => {
  const soundboard = useStore(state => state.widgetConfig.soundboard);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
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
