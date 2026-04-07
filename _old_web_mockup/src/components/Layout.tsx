import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
