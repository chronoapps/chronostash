import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg dark:shadow-blue-500/30 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl dark:hover:shadow-blue-500/40',
      secondary: 'glass-light dark:glass text-gray-700 dark:text-slate-300 hover:glass-hover',
      danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg dark:shadow-red-500/30 hover:from-red-600 hover:to-rose-700 hover:shadow-xl dark:hover:shadow-red-500/40',
      ghost: 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
