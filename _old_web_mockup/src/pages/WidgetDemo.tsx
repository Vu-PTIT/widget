import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export default function WidgetDemo() {
  const navigate = useNavigate();
  const widgetConfig = useStore(state => state.widgetConfig);
  const friend = useStore(state => state.friends[0]); // Just use the first friend for demo
  
  const [isRecording, setIsRecording] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartRecording = () => {
    setIsRecording(true);
    timerRef.current = setTimeout(() => {
      handleStopRecording();
    }, 10000); // max 10s
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Simulate sending and then receiving a reply
    setTimeout(() => {
      setIsIncoming(true);
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Heartbeat pattern
      }
      setTimeout(() => setIsIncoming(false), 5000);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-black relative overflow-hidden">
      {/* Simulated Home Screen Background */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center" />
      
      <header className="relative z-10 p-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
          <ArrowLeft size={20} />
        </button>
        <span className="text-white font-medium drop-shadow-md">Màn hình chính (Demo)</span>
      </header>

      <div className="flex-1 relative z-10 flex items-center justify-center p-8">
        {/* The Widget */}
        <motion.div 
          animate={isIncoming ? { scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] } : {}}
          transition={{ duration: 0.5, repeat: isIncoming ? Infinity : 0 }}
          className={cn(
            "w-full aspect-square max-w-[280px] rounded-[3rem] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden cursor-pointer",
            widgetConfig.theme,
            isIncoming && "shadow-[0_0_50px_rgba(236,72,153,0.6)]"
          )}
          onClick={() => {
            if (isIncoming) {
              setIsIncoming(false);
              navigate(`/chat/${friend.id}`);
            }
          }}
        >
          {/* Friend Info */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <span className="text-white/90 font-bold text-sm drop-shadow-md">{friend.name}</span>
            {isIncoming && <span className="text-white font-medium text-xs mt-1 animate-pulse">Đang thì thầm...</span>}
          </div>

          {/* Top row sounds */}
          <div className="flex justify-between mt-8">
            <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner hover:bg-black/30 transition-colors active:scale-90">
              {widgetConfig.soundboard[0]?.icon}
            </button>
            <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner hover:bg-black/30 transition-colors active:scale-90">
              {widgetConfig.soundboard[1]?.icon}
            </button>
          </div>

          {/* Center Mic */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0.3 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute inset-0 bg-white rounded-full"
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
                "w-24 h-24 rounded-full backdrop-blur-xl flex items-center justify-center border shadow-[0_0_30px_rgba(255,255,255,0.2)] pointer-events-auto transition-all",
                isRecording ? "bg-white/40 border-white/50 scale-110" : "bg-white/20 border-white/30 hover:bg-white/30"
              )}
            >
              <Mic size={40} className={cn("transition-colors", isRecording ? "text-pink-500" : "text-white")} />
            </button>
          </div>

          {/* Bottom row sounds */}
          <div className="flex justify-between mb-2">
            <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner hover:bg-black/30 transition-colors active:scale-90">
              {widgetConfig.soundboard[2]?.icon}
            </button>
            <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner hover:bg-black/30 transition-colors active:scale-90">
              {widgetConfig.soundboard[3]?.icon}
            </button>
          </div>
        </motion.div>
      </div>
      
      <div className="relative z-10 p-8 text-center text-white/70 text-sm">
        <p>Nhấn giữ Mic để ghi âm.</p>
        <p className="mt-2 text-xs opacity-50">Sau khi gửi, đợi 2s để nhận tin nhắn giả lập.</p>
      </div>
    </div>
  );
}
