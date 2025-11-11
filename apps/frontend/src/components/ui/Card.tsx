import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export default function Card({ children, className, hover = false, glass = true }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-300',
        glass ? 'glass-light dark:glass border-gray-200 dark:border-slate-700/50' : 'bg-white dark:bg-dark-bg-secondary border-gray-200 dark:border-slate-700',
        hover && 'hover:glass-hover dark:hover:glow hover:scale-[1.02] cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 border-b border-gray-200 dark:border-slate-700/50', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 border-t border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-900/50', className)}>
      {children}
    </div>
  );
}
