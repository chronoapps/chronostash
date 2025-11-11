import { ReactNode } from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm dark:shadow-green-500/20',
    error: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm dark:shadow-red-500/20',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-sm dark:shadow-yellow-500/20',
    info: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm dark:shadow-blue-500/20',
    default: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600',
  };

  return (
    <span className={clsx('inline-flex px-2.5 py-1 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
