import type { Config } from 'tailwindcss';

/**
 * Design tokens for the Platform Engineering Center.
 *
 * This is an operations console, not a marketing surface: engineers read it
 * during incidents. The reference point is physical infrastructure labeling —
 * patch-panel port tags, rack-unit stencils, punch-down block numbering —
 * not a generic SaaS dashboard. That's where the amber signal color comes
 * from (hazard-tape/rack-label amber, not a trendy brand teal), and why
 * headings and labels are set in a monospace built for stenciled, fixed-width
 * text rather than a general-purpose UI sans.
 *
 * A fixed five-hue key marks resource types everywhere (graphs, tables,
 * badges); a red -> orange -> amber gradient marks blast-radius depth the
 * same way in every view. Every hex below was chosen and re-checked by hand —
 * none of them are stock Tailwind palette stops.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0a0c10', // page background — graphite, not blue-black
        surface: {
          DEFAULT: '#15181e', // panels, toolbars, cards
          raised: '#1d212a', // popovers, modals, floating panels
        },
        line: '#272b34', // hairlines / borders
        signal: {
          DEFAULT: '#e0993d', // brand accent — rack-label amber, used sparingly
          dim: '#7a5522',
        },
        resource: {
          server: '#4c86c9', // slate blue — steel chassis
          application: '#9873d1', // muted violet
          database: '#cf5a83', // muted rose
          url: '#39a394', // teal — the console's old accent, now a resource hue
          vip: '#7a9e42', // olive lime
        },
        impact: {
          source: '#c8452e', // the thing that went down
          direct: '#d3792c', // one hop away
          indirect: '#cf9f3d', // two+ hops away
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
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
