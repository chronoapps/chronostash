import { Outlet, Link, useLocation } from 'react-router-dom';
import { Database, HardDrive, Archive, RotateCcw, Calendar, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Databases', href: '/databases', icon: Database },
  { name: 'Storage Targets', href: '/storage-targets', icon: HardDrive },
  { name: 'Backups', href: '/backups', icon: Archive },
  { name: 'Restores', href: '/restores', icon: RotateCcw },
  { name: 'Schedules', href: '/schedules', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary transition-colors duration-300">
      {/* Glass Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64
                      bg-white/80 dark:bg-dark-bg-secondary/60
                      backdrop-blur-xl
                      border-r border-gray-200 dark:border-slate-700/50
                      z-40">

        {/* Logo Header */}
        <div className="flex h-16 items-center px-6
                        border-b border-gray-200 dark:border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg
                            bg-gradient-to-br from-blue-500 to-purple-600
                            flex items-center justify-center
                            shadow-lg dark:shadow-blue-500/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold
                           bg-gradient-to-r from-gray-900 to-gray-600
                           dark:from-white dark:to-slate-300
                           bg-clip-text text-transparent">
              ChronoStash
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 glow'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3
                        border-t border-gray-200 dark:border-slate-700/50">
          {user && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg
                            bg-gray-100/50 dark:bg-slate-800/50">
              <span className="text-sm text-gray-700 dark:text-slate-300">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700
                         text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400
                         transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6 min-h-screen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
