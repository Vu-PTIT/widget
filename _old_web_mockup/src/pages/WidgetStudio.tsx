import { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, Palette, Music, Smartphone, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

const THEMES = [
  { id: 't1', class: 'bg-pink-500', name: 'Pink' },
  { id: 't2', class: 'bg-gradient-to-br from-indigo-500 to-purple-500', name: 'Midnight' },
  { id: 't3', class: 'bg-gradient-to-br from-emerald-400 to-cyan-400', name: 'Mint' },
  { id: 't4', class: 'bg-neutral-800', name: 'Dark' },
];

const AVAILABLE_SOUNDS = [
  { id: 's1', icon: '🐱', name: 'Meow' },
  { id: 's2', icon: '🤡', name: 'Bruh' },
  { id: 's3', icon: '🚪', name: 'Knock' },
  { id: 's4', icon: '💨', name: 'Fart' },
  { id: 's5', icon: '💋', name: 'Kiss' },
  { id: 's6', icon: '🐶', name: 'Bark' },
  { id: 's7', icon: '🥁', name: 'Ba-dum-tss' },
  { id: 's8', icon: '🦗', name: 'Crickets' },
];

export default function WidgetStudio() {
  const navigate = useNavigate();
  const widgetConfig = useStore(state => state.widgetConfig);
  const updateWidgetConfig = useStore(state => state.updateWidgetConfig);
  const [activeTab, setActiveTab] = useState<'theme' | 'sounds'>('theme');

  const appTheme = useStore(state => state.settings.appTheme);

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-500", appTheme)}>
      <header className="px-6 pt-8 pb-4 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-900 transition-colors shrink-0">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Widget Studio</h1>
            <p className="text-neutral-500 text-sm mt-1">Cá nhân hóa trải nghiệm "vô tri"</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/widget-demo')}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 px-3 py-2 rounded-xl text-sm font-medium transition-colors border border-neutral-800 mt-1"
        >
          <Smartphone size={16} className="text-pink-500" />
          <span>Demo</span>
        </button>
      </header>

      {/* Preview Area */}
      <div className="p-8 flex justify-center items-center bg-neutral-900/50 border-y border-neutral-900">
        <div className="relative w-48 h-48">
          {/* Simulated Widget */}
          <motion.div 
            className={cn(
              "w-full h-full rounded-[2.5rem] p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden",
              widgetConfig.theme
            )}
          >
            {/* Top row sounds */}
            <div className="flex justify-between">
              <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
                {widgetConfig.soundboard[0]?.icon}
              </div>
              <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
                {widgetConfig.soundboard[1]?.icon}
              </div>
            </div>

            {/* Center Mic */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <Mic size={32} className="text-white" />
              </div>
            </div>

            {/* Bottom row sounds */}
            <div className="flex justify-between">
              <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
                {widgetConfig.soundboard[2]?.icon}
              </div>
              <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
                {widgetConfig.soundboard[3]?.icon}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex bg-neutral-900 rounded-xl p-1 mb-6">
          <button 
            onClick={() => setActiveTab('theme')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === 'theme' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Palette size={16} /> Giao diện
          </button>
          <button 
            onClick={() => setActiveTab('sounds')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === 'sounds' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Music size={16} /> Âm thanh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          {activeTab === 'theme' ? (
            <div className="grid grid-cols-2 gap-4">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateWidgetConfig({ theme: theme.class })}
                  className={cn(
                    "h-24 rounded-2xl flex items-end p-3 transition-all border-2",
                    theme.class,
                    widgetConfig.theme === theme.class ? "border-white scale-95" : "border-transparent hover:scale-[0.98]"
                  )}
                >
                  <span className="text-white font-medium text-sm drop-shadow-md">{theme.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-neutral-400">Chọn 4 âm thanh để gán vào các góc của Widget.</p>
              <div className="grid grid-cols-4 gap-4">
                {AVAILABLE_SOUNDS.map(sound => {
                  const isSelected = widgetConfig.soundboard.some(s => s.id === sound.id);
                  return (
                    <button
                      key={sound.id}
                      onClick={() => {
                        if (isSelected) return; // Simplified: just prevent adding if already there. In real app, allow swapping.
                        // Very simple swap logic: replace the first one
                        const newBoard = [...widgetConfig.soundboard];
                        newBoard.shift();
                        newBoard.push({ ...sound, soundUrl: '' });
                        updateWidgetConfig({ soundboard: newBoard });
                      }}
                      className={cn(
                        "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all",
                        isSelected ? "bg-pink-500/20 border-2 border-pink-500 text-pink-500" : "bg-neutral-900 border-2 border-transparent hover:bg-neutral-800 text-neutral-400"
                      )}
                    >
                      <span className="text-2xl">{sound.icon}</span>
                      <span className="text-[10px] font-medium truncate w-full text-center px-1">{sound.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
