/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // Modern neutral palette
        'bg-primary': '#f9fafb',
        'bg-secondary': '#f5f5f7',
        'card': '#ffffff',
        'card-hover': '#fafafa',
        
        // EFInA brand colors (Purple/Indigo palette)
        'brand-purple': '#5b21b6',
        'brand-purple-light': '#ede9fe',
        'brand-purple-dark': '#4c1d95',
        'brand-indigo': '#4f46e5',
        'brand-indigo-light': '#e0e7ff',
        'brand-indigo-dark': '#3730a3',
        
        // Status colors
        'brand-green': '#10b981',
        'brand-green-light': '#d1fae5',
        'brand-green-dark': '#059669',
        'brand-red': '#ef4444',
        'brand-red-light': '#fee2e2',
        'brand-red-dark': '#dc2626',
        
        // Accent colors (EFInA themed)
        'accent-primary': '#5b21b6',
        'accent-primary-light': '#ede9fe',
        'accent-secondary': '#4f46e5',
        'accent-blue': '#6366f1',
        'accent-orange': '#f59e0b',
        
        // Text colors
        'text-primary': '#111827',
        'text-secondary': '#6b7280',
        'text-tertiary': '#9ca3af',
        
        // Border colors
        'border-light': '#e5e7eb',
        'border-medium': '#d1d5db',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'inner-sm': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
