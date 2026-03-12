import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut, Shirt, Palette, LayoutGrid, Tags } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200/30 select-none" style={{ cursor: 'default' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-lg font-light tracking-widest uppercase text-gray-900">
                Digital Wardrobe
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <NavLink to="/dashboard" active={isActive('/dashboard')} icon={<Shirt size={18} />}>
              衣服
            </NavLink>
            <NavLink to="/canvas" active={isActive('/canvas')} icon={<Palette size={18} />}>
              搭配
            </NavLink>
            <NavLink to="/outfits" active={isActive('/outfits')} icon={<LayoutGrid size={18} />}>
              我的搭配
            </NavLink>
            <NavLink to="/settings" active={isActive('/settings')} icon={<Tags size={18} />}>
              标签管理
            </NavLink>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors rounded-xl hover:bg-white/50"
            >
              <LogOut size={18} className="mr-1.5" />
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 text-sm font-medium transition-all rounded-xl ${
        active
          ? 'bg-gray-900 text-white shadow-lg'
          : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {children}
    </Link>
  );
}
