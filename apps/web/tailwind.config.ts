import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush:      { DEFAULT: '#f4b8b0', light: '#fde8e5', dark: '#e8917f' },
        sage:       { DEFAULT: '#8fad88', light: '#c4d9c0', dark: '#5e8a5a' },
        cream:      { DEFAULT: '#fdf6f0', dark: '#f5e8d8' },
        terracotta: { DEFAULT: '#d4856a', light: '#e8b09a', dark: '#b5634a' },
        charcoal:   { DEFAULT: '#3a3a3a', light: '#6b6b6b' },
      },
      fontFamily: {
        heading: ['var(--font-playfair)', 'Georgia', 'serif'],
        body:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card:       '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 6px 24px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
