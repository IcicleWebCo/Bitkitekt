/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  safelist: [
    // Gradient from colors
    'from-cyan-500', 'from-orange-500', 'from-teal-500', 'from-emerald-500', 'from-amber-500',
    'from-sky-500', 'from-rose-500', 'from-green-500', 'from-yellow-500', 'from-lime-500',
    'from-blue-500', 'from-red-500', 'from-pink-500', 'from-fuchsia-500',
    'from-cyan-400', 'from-orange-400', 'from-teal-400', 'from-emerald-400', 'from-amber-400',
    'from-sky-400', 'from-rose-400', 'from-green-400', 'from-yellow-400', 'from-lime-400',
    'from-blue-400', 'from-red-400', 'from-pink-400', 'from-fuchsia-400',
    // Gradient to colors
    'to-cyan-500', 'to-orange-500', 'to-teal-500', 'to-emerald-500', 'to-amber-500',
    'to-sky-500', 'to-rose-500', 'to-green-500', 'to-yellow-500', 'to-lime-500',
    'to-blue-500', 'to-red-500', 'to-pink-500', 'to-fuchsia-500',
    'to-cyan-400', 'to-orange-400', 'to-teal-400', 'to-emerald-400', 'to-amber-400',
    'to-sky-400', 'to-rose-400', 'to-green-400', 'to-yellow-400', 'to-lime-400',
    'to-blue-400', 'to-red-400', 'to-pink-400', 'to-fuchsia-400',
    // Hover gradient from colors
    'hover:from-cyan-500', 'hover:from-orange-500', 'hover:from-teal-500', 'hover:from-emerald-500', 'hover:from-amber-500',
    'hover:from-sky-500', 'hover:from-rose-500', 'hover:from-green-500', 'hover:from-yellow-500', 'hover:from-lime-500',
    'hover:from-blue-500', 'hover:from-red-500', 'hover:from-pink-500', 'hover:from-fuchsia-500',
    'hover:from-cyan-400', 'hover:from-orange-400', 'hover:from-teal-400', 'hover:from-emerald-400', 'hover:from-amber-400',
    'hover:from-sky-400', 'hover:from-rose-400', 'hover:from-green-400', 'hover:from-yellow-400', 'hover:from-lime-400',
    'hover:from-blue-400', 'hover:from-red-400', 'hover:from-pink-400', 'hover:from-fuchsia-400',
    // Hover gradient to colors
    'hover:to-cyan-500', 'hover:to-orange-500', 'hover:to-teal-500', 'hover:to-emerald-500', 'hover:to-amber-500',
    'hover:to-sky-500', 'hover:to-rose-500', 'hover:to-green-500', 'hover:to-yellow-500', 'hover:to-lime-500',
    'hover:to-blue-500', 'hover:to-red-500', 'hover:to-pink-500', 'hover:to-fuchsia-500',
    'hover:to-cyan-400', 'hover:to-orange-400', 'hover:to-teal-400', 'hover:to-emerald-400', 'hover:to-amber-400',
    'hover:to-sky-400', 'hover:to-rose-400', 'hover:to-green-400', 'hover:to-yellow-400', 'hover:to-lime-400',
    'hover:to-blue-400', 'hover:to-red-400', 'hover:to-pink-400', 'hover:to-fuchsia-400',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      backgroundColor: {
        light: {
          primary: '#ffffff',
          secondary: '#f5f5f5',
          accent: '#eff6ff',
        },
        dark: {
          primary: '#0a0a0a',
          secondary: '#171717',
          accent: '#1e3a8a',
        },
      },
      textColor: {
        light: {
          primary: '#0a0a0a',
          secondary: '#525252',
          accent: '#2563eb',
          contrast: '#ea580c',
        },
        dark: {
          primary: '#ffffff',
          secondary: '#d4d4d4',
          accent: '#60a5fa',
          contrast: '#fb923c',
        },
      },
      borderColor: {
        light: {
          primary: '#e5e5e5',
          secondary: '#d4d4d4',
          accent: '#93c5fd',
        },
        dark: {
          primary: '#262626',
          secondary: '#404040',
          accent: '#1e40af',
        },
      },
    },
  },
  plugins: [],
};
