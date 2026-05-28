/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      { DEFAULT: '#09090E', 1: '#0F0F16', 2: '#14141C', 3: '#1A1A24', 4: '#21212E' },
        border:  { DEFAULT: 'rgba(255,255,255,0.07)', bright: 'rgba(255,255,255,0.12)', focus: 'rgba(124,58,237,0.5)' },
        violet:  { DEFAULT: '#7C3AED', light: '#9F67FF', dim: 'rgba(124,58,237,0.15)', glow: 'rgba(124,58,237,0.35)' },
        cyan:    { DEFAULT: '#06B6D4', dim: 'rgba(6,182,212,0.12)', glow: 'rgba(6,182,212,0.3)' },
        emerald: { DEFAULT: '#10B981', dim: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.3)' },
        amber:   { DEFAULT: '#F59E0B', dim: 'rgba(245,158,11,0.12)' },
        rose:    { DEFAULT: '#F43F5E', dim: 'rgba(244,63,94,0.12)' },
        slate:   {
          50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
          400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155',
          800: '#1E293B', 900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:    ['11px', '16px'],
        sm:    ['13px', '20px'],
        base:  ['14px', '22px'],
        md:    ['15px', '24px'],
        lg:    ['17px', '26px'],
        xl:    ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '38px'],
      },
      borderRadius: {
        sm: '6px', DEFAULT: '8px', md: '10px', lg: '12px', xl: '16px', '2xl': '20px',
      },
      boxShadow: {
        card:    '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        elevated:'0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)',
        modal:   '0 24px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)',
        violet:  '0 0 0 1px rgba(124,58,237,0.5), 0 4px 16px rgba(124,58,237,0.25)',
        glow:    '0 0 20px rgba(124,58,237,0.4)',
        'glow-cyan':    '0 0 20px rgba(6,182,212,0.3)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'slide-in-r': 'slideInR 0.25s ease-out',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'stream':     'stream 0.1s ease-out',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInR: { from: { opacity: 0, transform: 'translateX(12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        stream:   { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
