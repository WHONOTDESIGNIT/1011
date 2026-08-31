import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', ...fontFamily.sans],
        sans: ['Manrope', ...fontFamily.sans],
      },
      maxWidth: {
        xl: '691px',
        '2xl': '806px',
        '3xl': '922px',
        '4xl': '1075px',
        '5xl': '1229px',
        // 内容级版心 = global.css :root 的 --max-w-content（1382px）
        '6xl': 'var(--max-w-content)',
      },
      colors: {
        // 色值全部引用 global.css :root 色彩令牌（单一事实源）
        brand: {
          primary: 'var(--color-primary)',
          'primary-100': 'var(--color-primary-100)',
          'primary-50': 'var(--color-primary-50)',
          'blue-200': 'var(--color-blue-200)',
          'blue-400': 'var(--color-blue-400)',
          'blue-800': 'var(--color-blue-800)',
          'bright-50': 'var(--color-bright-50)',
          'cream-100': 'var(--color-cream-100)',
          'cream-50': 'var(--color-cream-50)',
        },
        neutral: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
        develo: {
          black: 'var(--color-ink)',
          white: 'var(--color-white)',
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
