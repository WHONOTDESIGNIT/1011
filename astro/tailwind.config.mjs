import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', ...fontFamily.sans],
        sans: ['Manrope', ...fontFamily.sans],
      },
      colors: {
        brand: {
          primary: '#563cfa',
          'primary-100': '#c6bff8',
          'primary-50': '#edebfc',
          'blue-200': '#a1ace3',
          'blue-400': '#4a62d3',
          'blue-800': '#1a2175',
          'bright-50': '#e7eaf8',
          'cream-100': '#f0e0c3',
          'cream-50': '#f8f2e8',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7380',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        develo: {
          black: '#020303',
          white: '#ffffff',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
};
