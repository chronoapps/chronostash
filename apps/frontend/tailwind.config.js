/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Dark mode palette
        dark: {
          bg: {
            primary: '#0f172a',
            secondary: '#1e293b',
            tertiary: '#334155',
          },
        },
        // Accent colors
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          green: '#10b981',
          red: '#ef4444',
          cyan: '#06b6d4',
          yellow: '#f59e0b',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        // Glass effects
        '.glass': {
          'background': 'rgba(30, 41, 59, 0.4)',
          'backdrop-filter': 'blur(12px) saturate(150%)',
          '-webkit-backdrop-filter': 'blur(12px) saturate(150%)',
          'border': '1px solid rgba(148, 163, 184, 0.15)',
          'transform': 'translateZ(0)',
        },
        '.glass-hover': {
          'background': 'rgba(30, 41, 59, 0.6)',
          'border-color': 'rgba(148, 163, 184, 0.25)',
        },
        '.glass-strong': {
          'background': 'rgba(30, 41, 59, 0.7)',
          'backdrop-filter': 'blur(20px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(180%)',
          'border': '1px solid rgba(148, 163, 184, 0.2)',
          'transform': 'translateZ(0)',
        },
        '.glass-light': {
          'background': 'rgba(255, 255, 255, 0.6)',
          'backdrop-filter': 'blur(12px) saturate(150%)',
          '-webkit-backdrop-filter': 'blur(12px) saturate(150%)',
          'border': '1px solid rgba(148, 163, 184, 0.2)',
          'transform': 'translateZ(0)',
        },
        // Glow effects
        '.glow': {
          'box-shadow': '0 0 20px rgba(59, 130, 246, 0.15)',
        },
        '.glow-strong': {
          'box-shadow': '0 0 30px rgba(59, 130, 246, 0.3)',
        },
        '.glow-green': {
          'box-shadow': '0 0 20px rgba(16, 185, 129, 0.15)',
        },
        '.glow-red': {
          'box-shadow': '0 0 20px rgba(239, 68, 68, 0.15)',
        },
        '.glow-purple': {
          'box-shadow': '0 0 20px rgba(139, 92, 246, 0.15)',
        },
      };
      addUtilities(newUtilities);
    }
  ],
}
