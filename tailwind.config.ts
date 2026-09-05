import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base Dynamic Tokens from SKILL.md
        ink: 'var(--color-ink)',
        moss: 'var(--color-moss)',
        card: 'var(--color-card)',
        line: 'var(--color-line)',

        // Semantic system mappings
        background: 'var(--color-moss)',
        foreground: 'var(--color-ink)',
        surface: {
          DEFAULT: 'var(--color-card)',
          elevated: 'var(--surface-elevated)',
          subtle: 'var(--surface-subtle)',
        },
        'text-primary': 'var(--color-ink)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--color-line)',
        'border-subtle': 'var(--border-subtle)',
        ring: 'var(--ring)',

        // Primary Accent: Botanical Pine (Linear + Stripe Climate aesthetic)
        pine: {
          50: '#eef7f1',
          100: '#d9eee2',
          200: '#b3dcc6',
          300: '#86c5a5',
          400: '#4fa881',
          500: '#228a61',
          600: '#12855a',
          700: '#0e5138',
          800: '#0b3d2e',
          900: '#082d22',
          950: '#052018',
        },

        // Attention Accent: Warm Marigold / Amber
        mari: {
          50: '#fef8ec',
          100: '#fcefd3',
          200: '#f9dea6',
          300: '#f3c76f',
          400: '#eda82c',
          500: '#e8940a',
          600: '#c47a05',
          700: '#97600a',
          800: '#6f4708',
        },

        // Alert Accent: Flare Rose / Crimson
        flare: {
          100: '#fbe3e7',
          200: '#f7c2cb',
          300: '#f097a8',
          400: '#e56782',
          500: '#d6455d',
          600: '#b93550',
          700: '#962a3d',
        },

        // Counterparty Accent: Sky Blue
        skyx: {
          100: '#e2f0f9',
          200: '#bedef2',
          300: '#91c7e9',
          400: '#5da9dd',
          500: '#388dcb',
          600: '#2273a8',
          700: '#1b5c86',
        },

        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          subtle: 'var(--success-subtle)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
          subtle: 'var(--warning-subtle)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          foreground: 'var(--danger-foreground)',
          subtle: 'var(--danger-subtle)',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'Newsreader', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(8, 45, 34, 0.05), 0 10px 30px -18px rgba(8, 45, 34, 0.25)',
        hero: '0 10px 30px -5px rgba(14, 81, 56, 0.35)',
        xs: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        subtle: '0 1px 2px 0 rgba(8, 45, 34, 0.05)',
        elevated: '0 4px 12px 0 rgba(8, 45, 34, 0.08), 0 2px 4px 0 rgba(8, 45, 34, 0.04)',
        modal: '0 12px 32px 0 rgba(8, 45, 34, 0.22), 0 4px 12px 0 rgba(8, 45, 34, 0.1)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      maxWidth: {
        '8xl': '1600px',
      },
      animation: {
        'fade-in': 'fadeIn 180ms cubic-bezier(0.22, 0.9, 0.3, 1)',
        'fade-out': 'fadeOut 150ms ease-in',
        'scale-in': 'scaleIn 180ms cubic-bezier(0.22, 0.9, 0.3, 1)',
        'slide-up': 'slideUp 220ms cubic-bezier(0.22, 0.9, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
