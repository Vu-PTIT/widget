import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, UserPlus, QrCode, Copy, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, User } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';

export default function AddFriend() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const allFriends = useStore(state => state.friends);
  const friends = allFriends.filter(f => f.type !== 'group');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  
  const addFriend = useStore(state => state.addFriend);
  const removeFriend = useStore(state => state.removeFriend);

  const handleSearch = () => {
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    setFoundUser(null);
    
    // Mock API call
    setTimeout(() => {
      setIsSearching(false);
      setFoundUser({
        id: Math.random().toString(),
        name: `Bạn mới`,
        username: searchQuery.replace('@', ''),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchQuery}`,
        status: 'online'
      });
    }, 1000);
  };

  const handleAdd = () => {
    if (foundUser) {
      addFriend(foundUser);
      navigate('/home');
    }
  };

  const handleCopy = () => {
    if (currentUser) {
      navigator.clipboard.writeText(`@${currentUser.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const appTheme = useStore(state => state.settings.appTheme);

  return (
    <div className={cn("h-full flex flex-col p-6 transition-colors duration-500", appTheme)}>
      <header className="pt-4 mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-900 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Thêm bạn bè</h1>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        {/* Search Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Tìm bạn mới</h3>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={20} className="text-neutral-500" />
            </div>
            <input
              type="text"
              placeholder="Nhập @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.replace(/[^a-zA-Z0-9_@]/g, '').toLowerCase())}
              className="w-full bg-neutral-900 border-2 border-transparent focus:border-pink-500 rounded-2xl py-4 pl-12 pr-24 text-base outline-none transition-all placeholder:text-neutral-600"
            />
            <button
              onClick={handleSearch}
              disabled={searchQuery.length < 3 || isSearching}
              className="absolute inset-y-2 right-2 px-4 bg-pink-500 hover:bg-pink-500/80 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl font-bold transition-colors flex items-center justify-center"
            >
              {isSearching ? (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                'Tìm'
              )}
            </button>
          </div>
        </div>

        {/* Search Result */}
        <AnimatePresence>
          {foundUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-neutral-900 rounded-[2rem] p-4 flex items-center gap-4 border border-neutral-800"
            >
              <img src={foundUser.avatar} alt={foundUser.name} className="w-16 h-16 rounded-full bg-neutral-800" />
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-lg truncate">{foundUser.name}</h4>
                <p className="text-xs text-pink-500 font-medium mt-1 truncate">@{foundUser.username}</p>
              </div>
              <button
                onClick={handleAdd}
                className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/25 shrink-0"
              >
                <UserPlus size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Friend List Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2 mb-4">Danh sách bạn bè ({friends.length})</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {friends.map(friend => (
              <div key={friend.id} className="bg-neutral-900 rounded-2xl p-3 flex items-center gap-3 border border-neutral-800">
                <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full bg-neutral-800 object-cover" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-sm truncate">{friend.nickname || friend.name}</h4>
                  <p className="text-xs text-neutral-500 truncate">@{friend.username}</p>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {friends.length === 0 && (
              <div className="text-center text-neutral-500 py-8 text-sm">
                Bạn chưa có bạn bè nào. Hãy tìm kiếm và thêm bạn nhé!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
