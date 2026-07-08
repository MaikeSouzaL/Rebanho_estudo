import type { Config } from 'tailwindcss';

/**
 * Design system — Master Prompt §8.
 * Semantic tokens map to CSS variables (globals.css) so Dark (default) and
 * Light themes swap cleanly. Gold is an ACCENT, never dominant.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // rgb(var(--rgb-x) / <alpha-value>) → modificadores /NN funcionam
        // (bg-bg/85, from-gold/10, border-success/60 …)
        bg: 'rgb(var(--rgb-bg) / <alpha-value>)',
        'bg-2': 'rgb(var(--rgb-bg-2) / <alpha-value>)',
        surface: 'rgb(var(--rgb-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--rgb-surface-2) / <alpha-value>)',
        gold: 'rgb(var(--rgb-gold) / <alpha-value>)',
        'gold-soft': 'rgb(var(--rgb-gold-soft) / <alpha-value>)',
        ink: 'rgb(var(--rgb-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--rgb-ink-muted) / <alpha-value>)',
        success: 'rgb(var(--rgb-success) / <alpha-value>)',
        line: 'var(--color-border)', // já traz alpha embutido
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['var(--font-serif)', 'Cambria', 'Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        card: '0 6px 24px -8px rgba(0,0,0,0.45)',
        glow: '0 0 0 1px var(--color-border), 0 12px 40px -12px rgba(0,0,0,0.55)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
      },
    },
  },
  plugins: [],
};

export default config;
