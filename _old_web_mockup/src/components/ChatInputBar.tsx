import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Check, X, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export const VOICE_EFFECTS = [
  { id: 'normal', icon: '🎤', label: 'Bình thường' },
  { id: 'chipmunk', icon: '🐿️', label: 'Sóc chuột' },
  { id: 'robot', icon: '🤖', label: 'Người máy' },
  { id: 'deep', icon: '👹', label: 'Giọng trầm' },
  { id: 'echo', icon: '🗣️', label: 'Tiếng vang' },
];

interface ChatInputBarProps {
  onSendVoice: (duration: number, voiceEffect: string) => void;
  onSendSound: (soundId: string) => void;
  className?: string;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendVoice, onSendSound, className }) => {
  const soundboard = useStore(state => state.widgetConfig.soundboard);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedVoiceEffect, setSelectedVoiceEffect] = useState('normal');
  const [showVoiceEffects, setShowVoiceEffects] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      onSendVoice(recordingTime, selectedVoiceEffect);
    }
  };

  return (
    <div className={cn("p-6 bg-neutral-900 rounded-t-[2rem] border-t border-neutral-800 relative shrink-0", className)}>
      <AnimatePresence>
        {showVoiceEffects && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-full left-6 mb-4 bg-neutral-800 border border-neutral-700 rounded-2xl p-2 flex flex-col gap-1 shadow-xl z-50"
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

        {!isRecording && (
          <button 
            onClick={() => setShowVoiceEffects(!showVoiceEffects)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shrink-0",
              showVoiceEffects ? "bg-pink-500 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
            )}
          >
            {VOICE_EFFECTS.find(e => e.id === selectedVoiceEffect)?.icon || '🎤'}
          </button>
        )}

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
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center gap-2">
              {soundboard.slice(0, 4).map(sound => (
                <button 
                  key={sound.id}
                  onClick={() => onSendSound(sound.id)}
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
  );
};
