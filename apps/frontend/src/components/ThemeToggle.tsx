import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg
                 glass-light dark:glass hover:glass-hover
                 transition-all duration-300
                 text-gray-700 dark:text-slate-300"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="flex items-center space-x-3">
        {isDark ? (
          <Moon className="w-5 h-5 text-blue-400" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-500" />
        )}
        <span className="text-sm font-medium">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      </div>
    </button>
  );
}
