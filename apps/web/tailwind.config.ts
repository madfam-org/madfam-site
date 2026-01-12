import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Single Source of Truth (from packages/ui/src/themes/brand-colors.ts)
        brand: {
          green: 'var(--logo-green)',
          'green-light': '#52b788',
          'green-dark': '#1e5128',
          purple: 'var(--logo-purple)',
          'purple-light': '#7d4f96',
          'purple-dark': '#3d1e4f',
          yellow: 'var(--logo-yellow)',
          'yellow-light': '#f7d64a',
          'yellow-dark': '#d4a20d',
        },
        // Legacy Creative Colors
        sun: '#FFD93D',
        leaf: '#6BCB77',
        lavender: '#9B59B6',
        obsidian: '#0A0E27',
        pearl: '#FAFAFA',
        // Semantic colors
        primary: 'var(--color-obsidian)',
        secondary: 'var(--color-sun)',
        success: 'var(--color-leaf)',
        creative: 'var(--color-lavender)',
        surface: 'var(--color-pearl)',
      },
      blur: {
        'brand-xl': '96px',
        'brand-2xl': '100px',
        'brand-3xl': '128px',
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      fontSize: {
        'display-xl': 'clamp(3rem, 5vw, 5rem)',
        display: 'clamp(2.5rem, 4vw, 4rem)',
        'heading-1': 'clamp(2rem, 3vw, 3rem)',
        'heading-2': 'clamp(1.5rem, 2.5vw, 2.5rem)',
        'heading-3': 'clamp(1.25rem, 2vw, 2rem)',
        'body-lg': 'clamp(1.125rem, 1.5vw, 1.25rem)',
      },
      spacing: {
        section: 'clamp(3rem, 8vw, 6rem)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.5s ease-out',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand':
          'linear-gradient(135deg, var(--color-obsidian) 0%, var(--color-lavender) 100%)',
        'mesh-gradient': `
          radial-gradient(at 40% 20%, var(--color-sun) 0px, transparent 50%),
          radial-gradient(at 80% 0%, var(--color-lavender) 0px, transparent 50%),
          radial-gradient(at 0% 50%, var(--color-leaf) 0px, transparent 50%),
          radial-gradient(at 80% 50%, var(--color-obsidian) 0px, transparent 50%),
          radial-gradient(at 0% 100%, var(--color-sun) 0px, transparent 50%)
        `,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};

export default config;
