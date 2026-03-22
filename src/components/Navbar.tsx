import React from 'react';
import { Sun, Moon, Search, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search posts, categories, authors..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border-transparent focus:bg-white dark:focus:bg-gray-800 border focus:border-indigo-600 rounded-xl outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-4 ml-auto">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800 mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{profile?.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
            </div>
            <img 
              src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || 'User'}`} 
              alt="Avatar"
              className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
