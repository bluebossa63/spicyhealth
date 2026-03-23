import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bridgerton / Regency palette
        blush:      { DEFAULT: '#e8c4c4', light: '#f5e1e1', dark: '#d4a0a0' },
        sage:       { DEFAULT: '#a3b899', light: '#d0ddc9', dark: '#7a9470' },
        cream:      { DEFAULT: '#faf6f1', dark: '#efe6da' },
        terracotta: { DEFAULT: '#7b9eb8', light: '#a8c4d8', dark: '#5a7d99' },
        charcoal:   { DEFAULT: '#3d3d4a', light: '#6e6e7a' },
        regency:    { DEFAULT: '#8faabe', light: '#c5d5e0', dark: '#6b8da5' },
        pistachio:  { DEFAULT: '#b5c9a8', light: '#dbe6d3', dark: '#8aab78' },
        rose:       { DEFAULT: '#d4a5a5', light: '#ecd4d4', dark: '#b88080' },
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
