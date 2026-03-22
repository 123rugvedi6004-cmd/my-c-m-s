import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  FileText, 
  Compass, 
  Bell, 
  User, 
  Settings, 
  PlusCircle,
  LogOut,
  X,
  Shield,
  Bookmark
} from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

const navItems = [
  { icon: Home, label: 'Home Feed', path: '/' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'My Posts', path: '/my-posts' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Bookmark, label: 'Saved Content', path: '/saved' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Shield, label: 'Admin Panel', path: '/admin', adminOnly: true },
];

export default function Sidebar() {
  const { profile, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {isOpen ? <X size={20} /> : <Home size={20} />}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                C
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                ContentCore
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            <NavLink 
              to="/editor"
              className="flex items-center gap-3 px-4 py-3 mb-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-medium"
              onClick={() => setIsOpen(false)}
            >
              <PlusCircle size={20} />
              <span>Create Post</span>
            </NavLink>

            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                    isActive 
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={20} className={cn(
                    "transition-colors",
                    "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  )} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Summary */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || 'User'}`} 
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{profile?.displayName || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{profile?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
