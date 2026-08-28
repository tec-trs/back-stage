import type { Config } from 'tailwindcss';

/**
 * Design tokens for the Platform Engineering Center.
 *
 * This is an operations console, not a marketing surface: engineers read it
 * during incidents. The palette stays dark and low-glare on purpose; what
 * makes it *this* product's own is the signal grammar layered on top of it —
 * a single teal accent for the system's own chrome, a fixed five-hue key for
 * resource types, and a red -> orange -> amber gradient for blast-radius
 * depth that reads the same way in every graph, table and badge.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0b0f19', // page background — deep, low-glare
        surface: {
          DEFAULT: '#121a2b', // panels, toolbars, cards
          raised: '#19233a', // popovers, modals, floating panels
        },
        line: '#232c40', // hairlines / borders
        signal: {
          DEFAULT: '#2dd4bf', // brand accent — focus rings, primary actions, console text
          dim: '#0f766e',
        },
        resource: {
          server: '#3b82f6',
          application: '#8b5cf6',
          database: '#ec4899',
          url: '#f59e0b',
          vip: '#06b6d4',
        },
        impact: {
          source: '#ef4444', // the thing that went down
          direct: '#f97316', // one hop away
          indirect: '#f59e0b', // two+ hops away
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        'radar-ping': {
          '0%': { transform: 'scale(0.6)', opacity: '0.7' },
          '80%': { opacity: '0' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'console-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'radar-ping': 'radar-ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
        'console-in': 'console-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
