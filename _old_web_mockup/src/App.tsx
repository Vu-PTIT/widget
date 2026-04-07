import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Chat from './pages/Chat';
import WidgetStudio from './pages/WidgetStudio';
import Settings from './pages/Settings';
import WidgetDemo from './pages/WidgetDemo';
import AddFriend from './pages/AddFriend';
import CreateGroup from './pages/CreateGroup';
import Layout from './components/Layout';

export default function App() {
  const currentUser = useStore((state) => state.currentUser);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-pink-500/30">
        <div className="max-w-md mx-auto h-screen relative overflow-hidden bg-neutral-900 shadow-2xl sm:rounded-3xl sm:h-[850px] sm:my-8 sm:border border-neutral-800">
          <Routes>
            {!currentUser ? (
              <Route path="*" element={<Onboarding />} />
            ) : (
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/studio" element={<WidgetStudio />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/widget-demo" element={<WidgetDemo />} />
                <Route path="/add-friend" element={<AddFriend />} />
                <Route path="/create-group" element={<CreateGroup />} />
              </Route>
            )}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
