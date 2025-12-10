/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  safelist: [
    {
      pattern: /^(from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
      variants: ['hover'],
    },
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
