import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Ear, HeartPulse, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

const SLIDES = [
  {
    id: 'intro',
    icon: <Mic className="w-16 h-16 text-pink-500" />,
    title: 'Echo Widget',
    desc: 'Nghe thấy nhau ngay cả khi không chạm. Gửi lời thì thầm trực tiếp từ màn hình chính.',
  },
  {
    id: 'raise',
    icon: <Ear className="w-16 h-16 text-pink-500" />,
    title: 'Raise-to-Listen',
    desc: 'Chỉ cần áp điện thoại lên tai để nghe. Riêng tư tuyệt đối, không lo ồn ào.',
  },
  {
    id: 'haptic',
    icon: <HeartPulse className="w-16 h-16 text-red-500" />,
    title: 'Nhịp Đập Yêu Thương',
    desc: 'Nhận thông báo bằng nhịp rung Haptic như một cú chạm nhẹ thay vì tiếng chuông.',
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const login = useStore(state => state.login);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      // Mock login
      login({
        id: 'me',
        name: 'You',
        username: 'whisperer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me',
        status: 'online'
      });
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(236,72,153,0.15)]">
              {SLIDES[currentSlide].icon}
            </div>
            <h1 className="text-3xl font-bold mb-4 text-pink-500">
              {SLIDES[currentSlide].title}
            </h1>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-xs">
              {SLIDES[currentSlide].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full flex flex-col items-center gap-8 pb-8">
        <div className="flex gap-2">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-pink-500' : 'w-2 bg-neutral-700'}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-pink-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-pink-500/25"
        >
          {currentSlide === SLIDES.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
