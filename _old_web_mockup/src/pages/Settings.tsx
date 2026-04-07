import { useState } from 'react';
import React from 'react';
import { Moon, Ear, HeartPulse, LogOut, ChevronLeft, ChevronRight, Palette, Edit2, Check, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const APP_THEMES = [
  { id: 'bg-neutral-950', name: 'Đen', color: 'bg-neutral-950' },
  { id: 'bg-gradient-to-br from-indigo-900 to-purple-900', name: 'Tím', color: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
  { id: 'bg-gradient-to-br from-emerald-900 to-teal-900', name: 'Xanh', color: 'bg-gradient-to-br from-emerald-400 to-teal-400' },
  { id: 'bg-gradient-to-br from-rose-900 to-pink-900', name: 'Hồng', color: 'bg-gradient-to-br from-rose-400 to-pink-400' },
  { id: 'bg-gradient-to-br from-blue-900 to-cyan-900', name: 'Biển', color: 'bg-gradient-to-br from-blue-400 to-cyan-400' },
];

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const updateProfile = useStore(state => state.updateProfile);
  const login = useStore(state => state.login);

  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');

  const confirmSaveProfile = () => {
    updateProfile({
      name: editName,
      username: editUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(),
      avatar: editAvatar
    });
    setIsEditing(false);
    setShowConfirm(false);
  };

  const handleSaveProfile = () => {
    setShowConfirm(true);
  };

  const handleRandomAvatar = () => {
    setEditAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`);
  };

  return (
    <div className={cn("h-full flex flex-col p-6 transition-colors duration-500", settings.appTheme)}>
      <header className="pt-4 mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-900 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
      </header>

      {/* Profile Section */}
      <div className="bg-neutral-900 rounded-[2rem] p-5 mb-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div 
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4"
            >
              <img src={currentUser?.avatar} alt="Me" className="w-16 h-16 rounded-full bg-neutral-800" />
              <div className="flex-1">
                <h2 className="font-bold text-lg">{currentUser?.name}</h2>
                <p className="text-sm text-pink-500 font-medium mt-1">@{currentUser?.username}</p>
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <Edit2 size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={editAvatar} alt="Me" className="w-16 h-16 rounded-full bg-neutral-800" />
                  <button 
                    onClick={handleRandomAvatar}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-pink-500 rounded-full border-2 border-neutral-900 flex items-center justify-center text-white hover:scale-110 transition-transform"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Tên hiển thị"
                    className="w-full bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-pink-500"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">@</span>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                      placeholder="username"
                      className="w-full bg-neutral-800 rounded-lg pl-7 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(currentUser?.name || '');
                    setEditUsername(currentUser?.username || '');
                    setEditAvatar(currentUser?.avatar || '');
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-400 hover:bg-neutral-800 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={!editName.trim() || !editUsername.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-500 text-white hover:bg-pink-500/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Check size={16} /> Lưu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings List */}
      <div className="space-y-6 flex-1 overflow-y-auto pb-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-4">Cá nhân hóa</h3>
          <div className="bg-neutral-900 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 mb-1">
              <Palette size={20} className="text-pink-500" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-white">Màu nền ứng dụng</h4>
                <p className="text-xs text-neutral-400">Chọn màu nền yêu thích</p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {APP_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateSettings({ appTheme: theme.id })}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full border-2 transition-all",
                    theme.color,
                    settings.appTheme === theme.id ? "border-white scale-110" : "border-transparent hover:scale-105"
                  )} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    settings.appTheme === theme.id ? "text-white" : "text-neutral-500"
                  )}>
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <SettingItem 
            icon={<Palette size={20} className="text-pink-500" />}
            title="Widget Studio"
            description="Tùy chỉnh giao diện và âm thanh"
            onClick={() => navigate('/studio')}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-4">Trải nghiệm</h3>
          
          <SettingItem 
            icon={<Moon size={20} className="text-indigo-400" />}
            title="Chế độ Tiệc ngủ"
            description="Tự động im lặng từ 23:00 - 06:00"
            hasToggle
            isActive={settings.sleepMode}
            onToggle={() => updateSettings({ sleepMode: !settings.sleepMode })}
          />
          
          <SettingItem 
            icon={<Ear size={20} className="text-pink-500" />}
            title="Raise-to-Listen"
            description="Áp tai để nghe qua loa trong"
            hasToggle
            isActive={settings.raiseToListen}
            onToggle={() => updateSettings({ raiseToListen: !settings.raiseToListen })}
          />

          <SettingItem 
            icon={<HeartPulse size={20} className="text-pink-500" />}
            title="Phản hồi Xúc giác"
            description={`Kiểu rung: ${settings.hapticFeedback === 'heartbeat' ? 'Nhịp tim' : settings.hapticFeedback === 'intense' ? 'Dồn dập' : 'Nhẹ nhàng'}`}
            onClick={() => {
              const next = settings.hapticFeedback === 'heartbeat' ? 'intense' : settings.hapticFeedback === 'intense' ? 'gentle' : 'heartbeat';
              updateSettings({ hapticFeedback: next });
            }}
          />
        </div>
      </div>

      {/* Logout */}
      <button 
        onClick={() => login(null as any)}
        className="mt-auto mb-6 w-full py-4 rounded-2xl bg-neutral-900 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shrink-0"
      >
        <LogOut size={20} />
        Đăng xuất
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 w-full max-w-sm rounded-[2rem] p-6 border border-neutral-800 shadow-2xl flex flex-col items-center">
            <h3 className="text-xl font-bold text-white mb-4">Xác nhận lưu?</h3>
            <p className="text-neutral-400 mb-6 text-center">Bạn có chắc chắn muốn lưu các thay đổi hồ sơ không?</p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-700"
              >
                Hủy
              </button>
              <button 
                onClick={confirmSaveProfile}
                className="flex-1 py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-500/80"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingItem({ 
  icon, 
  title, 
  description, 
  hasToggle, 
  isActive, 
  onToggle,
  onClick
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  hasToggle?: boolean, 
  isActive?: boolean, 
  onToggle?: () => void,
  onClick?: () => void
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-neutral-900 rounded-2xl p-4 flex items-center gap-4",
        onClick && "cursor-pointer hover:bg-neutral-800 transition-colors"
      )}
    >
      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      {hasToggle && (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
          className={cn(
            "w-12 h-7 rounded-full transition-colors relative",
            isActive ? "bg-pink-500" : "bg-neutral-700"
          )}
        >
          <div className={cn(
            "absolute top-1 w-5 h-5 rounded-full bg-white transition-all",
            isActive ? "left-6" : "left-1"
          )} />
        </button>
      )}
      {!hasToggle && onClick && (
        <ChevronRight size={20} className="text-neutral-500" />
      )}
    </div>
  );
}
