import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MoreVertical, Mic, Play, Square, X, Camera, Check, Trash2, AlertTriangle, UserPlus } from 'lucide-react';
import { useStore, Message } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appTheme, friends, currentUser, allMessages, soundboard } = useStore(useShallow(state => ({
    appTheme: state.settings.appTheme,
    friends: state.friends,
    currentUser: state.currentUser,
    allMessages: state.messages,
    soundboard: state.widgetConfig.soundboard
  })));
  
  const friend = friends.find(f => f.id === id);
  
  const messages = React.useMemo(() => allMessages.filter(m => 
    (m.senderId === id && m.receiverId === currentUser?.id) || 
    (m.senderId === currentUser?.id && m.receiverId === id)
  ), [allMessages, id, currentUser?.id]);
  
  const addMessage = useStore(state => state.addMessage);
  const updateFriend = useStore(state => state.updateFriend);
  const removeFriend = useStore(state => state.removeFriend);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editMembers, setEditMembers] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!friend) return <div>Friend not found</div>;

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
      addMessage({
        id: Date.now().toString(),
        senderId: currentUser!.id,
        receiverId: friend.id,
        type: 'voice',
        content: 'voice_url',
        duration: recordingTime,
        timestamp: Date.now()
      });
      
      // Subtle sound effect
      const audio = new Audio('https://actions.google.com/sounds/v1/ui/button_toggle.ogg');
      audio.volume = 0.2;
      audio.play().catch(() => {});
    }
  };

  const handleSendSound = (soundId: string) => {
    addMessage({
      id: Date.now().toString(),
      senderId: currentUser!.id,
      receiverId: friend.id,
      type: 'soundboard',
      content: soundId,
      timestamp: Date.now()
    });
    
    // Subtle sound effect
    const audio = new Audio('https://actions.google.com/sounds/v1/ui/button_toggle.ogg');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  };

  const individualFriends = friends.filter(f => f.type !== 'group');

  const handleOpenEdit = () => {
    setEditNickname(friend.nickname || friend.name);
    setEditAvatar(friend.avatar);
    setEditMembers(friend.members || []);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    updateFriend(friend.id, {
      nickname: editNickname,
      ...(friend.type === 'group' ? { avatar: editAvatar, members: editMembers } : {})
    });
    setIsEditingProfile(false);
  };

  const handleDeleteFriend = () => {
    removeFriend(friend.id);
    navigate('/');
  };

  const displayName = friend.nickname || friend.name;

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-500", appTheme)}>
      {/* Header */}
      <header className="h-20 flex items-center px-4 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-10 gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-900 transition-colors shrink-0 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={handleOpenEdit}>
          <img src={friend.avatar} alt={displayName} className="w-10 h-10 rounded-full bg-neutral-800 object-cover" />
          <div className="flex flex-col">
            <span className="font-bold">{displayName}</span>
            <span className="text-[10px] text-pink-500 font-medium uppercase tracking-wider">
              {friend.type === 'group' 
                ? `${friend.members?.length || 0} thành viên` 
                : (friend.status === 'online' ? 'Đang online' : friend.status === 'listening' ? 'Đang nghe...' : 'Đang ngủ')}
            </span>
          </div>
        </div>
        {friend.type === 'group' && (
          <button 
            onClick={handleOpenEdit}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-900 transition-colors shrink-0"
          >
            <UserPlus size={20} />
          </button>
        )}
        <button 
          onClick={handleOpenEdit}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-900 transition-colors shrink-0 -mr-2"
        >
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 gap-4">
            <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center">
              <Mic size={32} className="text-neutral-700" />
            </div>
            <p>Chưa có lời thì thầm nào.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isMe={msg.senderId === currentUser?.id} 
              soundboard={soundboard} 
              avatar={msg.senderId === currentUser?.id ? currentUser?.avatar : friend.avatar}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Interaction Area */}
      <div className="p-6 bg-neutral-900 rounded-t-[2rem] border-t border-neutral-800">
        <div className="flex items-center gap-4 mb-6">
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
              onMouseDown={handleStartRecording}
              onMouseUp={handleStopRecording}
              onMouseLeave={handleStopRecording}
              onTouchStart={handleStartRecording}
              onTouchEnd={handleStopRecording}
              className={cn(
                "relative w-16 h-16 rounded-full flex items-center justify-center transition-all z-10",
                isRecording ? "bg-pink-500 scale-110 shadow-[0_0_30px_rgba(236,72,153,0.5)]" : "bg-pink-500 shadow-lg"
              )}
            >
              {isRecording ? <Square size={24} className="text-white fill-white" /> : <Mic size={28} className="text-white" />}
            </button>
          </div>

          {isRecording ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex items-center gap-3 bg-neutral-800 rounded-full px-6 py-3 h-16"
            >
              <div className="flex items-center gap-1 flex-1 overflow-hidden">
                {/* Fake waveform */}
                {Array.from({ length: 30 }).map((_, i) => (
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
            <div className="flex-1 flex items-center justify-between">
              <button className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                <span className="text-xl">+</span>
              </button>
              
              <div className="flex items-center gap-2">
                {soundboard.slice(0, 4).map(sound => (
                  <button 
                    key={sound.id}
                    onClick={() => handleSendSound(sound.id)}
                    className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-xl hover:bg-neutral-700 hover:scale-110 transition-all active:scale-95"
                  >
                    {sound.icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 w-full max-w-sm rounded-[2rem] p-6 border border-neutral-800 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {showDeleteConfirm ? 'Xác nhận xóa' : `Chỉnh sửa ${friend.type === 'group' ? 'nhóm' : 'bạn bè'}`}
                </h3>
                <button 
                  onClick={() => {
                    setIsEditingProfile(false);
                    setShowDeleteConfirm(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {showDeleteConfirm ? (
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <p className="text-neutral-300 mb-6">
                    Bạn có chắc chắn muốn xóa <span className="font-bold text-white">{displayName}</span> khỏi danh sách không? Toàn bộ tin nhắn sẽ bị xóa.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleDeleteFriend}
                      className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                    >
                      Xóa ngay
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4 group">
                      <img src={editAvatar} alt="avatar" className="w-24 h-24 rounded-full bg-neutral-800 object-cover" />
                      {friend.type === 'group' && (
                        <button 
                          onClick={() => {
                            const seeds = ['Felix', 'Aneka', 'Jude', 'Leo', 'Mia'];
                            const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
                            setEditAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
                          }}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white border-2 border-neutral-900 hover:scale-110 transition-transform"
                        >
                          <Camera size={14} />
                        </button>
                      )}
                    </div>
                    {friend.type === 'group' && (
                      <p className="text-xs text-neutral-500">Nhấn icon camera để đổi avatar ngẫu nhiên</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1 ml-1">Biệt danh</label>
                      <input 
                        type="text" 
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="Nhập biệt danh..."
                        className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-500/50 transition-all border border-transparent focus:border-pink-500/50"
                      />
                    </div>

                    {friend.type === 'group' && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-2 ml-1">Thành viên ({editMembers.length})</label>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                          {individualFriends.map(f => (
                            <div 
                              key={f.id}
                              onClick={() => {
                                setEditMembers(prev => 
                                  prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]
                                );
                              }}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border",
                                editMembers.includes(f.id) ? "bg-pink-500/10 border-pink-500/50" : "bg-neutral-800 border-transparent hover:bg-neutral-700"
                              )}
                            >
                              <img src={f.avatar} alt={f.name} className="w-8 h-8 rounded-full bg-neutral-700" />
                              <span className="flex-1 text-sm font-medium truncate">{f.name}</span>
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center border",
                                editMembers.includes(f.id) ? "bg-pink-500 border-pink-500" : "border-neutral-600"
                              )}>
                                {editMembers.includes(f.id) && <Check size={12} className="text-white" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-12 h-12 shrink-0 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-1 py-3 rounded-xl bg-pink-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-pink-600 transition-colors active:scale-[0.98]"
                    >
                      <Check size={18} />
                      Lưu thay đổi
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MessageBubble: React.FC<{ message: Message, isMe: boolean, soundboard: any[], avatar?: string }> = ({ message, isMe, soundboard, avatar }) => {
  const time = format(message.timestamp, 'HH:mm');
  
  if (message.type === 'soundboard') {
    const sound = soundboard.find(s => s.id === message.content);
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
      >
        <div className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
          <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full bg-neutral-800 shrink-0" />
          <div className={cn(
            "text-4xl p-4 rounded-3xl",
            isMe ? "bg-neutral-900 rounded-br-sm" : "bg-neutral-900 rounded-bl-sm"
          )}>
            {sound?.icon || '❓'}
          </div>
        </div>
        <span className={cn("text-[10px] text-neutral-600 mt-1", isMe ? "mr-10" : "ml-10")}>{time}</span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
    >
      <div className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full bg-neutral-800 shrink-0" />
        <div className={cn(
          "flex items-center gap-3 p-3 pr-5 rounded-3xl",
          isMe ? "bg-pink-500 text-white rounded-br-sm" : "bg-neutral-800 text-white rounded-bl-sm"
        )}>
          <button className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            isMe ? "bg-white/20 hover:bg-white/30" : "bg-neutral-700 hover:bg-neutral-600"
          )}>
            <Play size={16} className={cn("ml-1", isMe ? "text-white fill-white" : "text-neutral-300 fill-neutral-300")} />
          </button>
          <div className="flex items-center gap-1">
            {/* Fake waveform */}
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className={cn("w-1 rounded-full", isMe ? "bg-white/70" : "bg-neutral-500")}
                style={{ height: `${Math.max(4, Math.random() * 24)}px` }}
              />
            ))}
          </div>
          <span className="text-xs font-mono font-medium ml-2 opacity-80">
            00:{message.duration?.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className={cn("text-[10px] text-neutral-600 mt-1", isMe ? "mr-10" : "ml-10")}>{time}</span>
    </motion.div>
  );
};
