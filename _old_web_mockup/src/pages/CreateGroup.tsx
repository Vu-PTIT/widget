import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore, User } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';

export default function CreateGroup() {
  const navigate = useNavigate();
  const friends = useStore(useShallow(state => state.friends.filter(f => f.type !== 'group')));
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  
  const addFriend = useStore(state => state.addFriend);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = () => {
    if (selectedFriends.length === 0 || !groupName) return;
    
    // Logic to create group
    addFriend({
      id: Date.now().toString(),
      name: groupName,
      username: groupName.toLowerCase().replace(/\s/g, ''),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${groupName}`,
      type: 'group',
      status: 'online',
      members: selectedFriends
    });
    
    navigate('/home');
  };

  const appTheme = useStore(state => state.settings.appTheme);

  return (
    <div className={cn("h-full flex flex-col p-6 transition-colors duration-500", appTheme)}>
      <header className="pt-4 mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-900 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Tạo nhóm mới</h1>
      </header>

      <div className="flex-1 flex flex-col gap-6">
        <input
          type="text"
          placeholder="Tên nhóm..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full bg-neutral-900 border-2 border-transparent focus:border-pink-500 rounded-2xl py-4 px-6 text-base outline-none transition-all placeholder:text-neutral-600"
        />

        <div className="flex-1 overflow-y-auto space-y-4">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider ml-2">Chọn bạn bè</h3>
          {friends.map(friend => (
            <div 
              key={friend.id}
              onClick={() => toggleFriend(friend.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2",
                selectedFriends.includes(friend.id) ? "bg-pink-500/10 border-pink-500" : "bg-neutral-900 border-transparent"
              )}
            >
              <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full bg-neutral-800" />
              <div className="flex-1">
                <h4 className="font-bold">{friend.name}</h4>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border-2",
                selectedFriends.includes(friend.id) ? "bg-pink-500 border-pink-500" : "border-neutral-700"
              )}>
                {selectedFriends.includes(friend.id) && <Check size={14} className="text-white" />}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleCreateGroup}
          disabled={selectedFriends.length === 0 || !groupName}
          className="w-full py-4 bg-pink-500 text-white font-bold rounded-2xl disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-pink-500/25"
        >
          Tạo nhóm ({selectedFriends.length})
        </button>
      </div>
    </div>
  );
}
