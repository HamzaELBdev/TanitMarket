/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Home redesign palette — mirrors the --tm-* CSS variables in
        // globals.css and the COLORS export in lib/design.js.
        brand: {
          forest: '#163300',
          'forest-hover': '#214a02',
          lime: '#9FE870',
          'lime-hover': '#b5f08f',
          mint: '#EDF8E7',
          hero: '#EFF5E9',
          moss: '#5A7C44',
          line: '#E3EBDD',
        },
        // Brand & accent — single lime-green CTA color, no second accent.
        primary: {
          DEFAULT: '#9fe870',
          active: '#cdffad',
          neutral: '#c5edab',
          pale: '#e2f6d5',
        },
        // Surface
        canvas: {
          DEFAULT: '#ffffff',
          soft: '#e8ebe6',
        },
        // Text
        ink: {
          DEFAULT: '#0e0f0c',
          deep: '#163300',
        },
        body: '#454745',
        mute: '#868685',
        // Semantic
        positive: {
          DEFAULT: '#2ead4b',
          deep: '#054d28',
        },
        warning: {
          DEFAULT: '#ffd11a',
          deep: '#b86700',
          content: '#4a3b1c',
        },
        negative: {
          DEFAULT: '#d03238',
          deep: '#a72027',
          darkest: '#a7000d',
          bg: '#320707',
        },
        // Tertiary illustration accents
        accent: {
          orange: '#ffc091',
          cyan: '#38c8ff',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '9999px',
        card: '20px',
        panel: '28px',
      },
      fontFamily: {
        // Wise Sans substitute: Manrope at weight 800/900 carries the geometric heaviness.
        heading: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-mega': ['126px', { lineHeight: '107.1px', fontWeight: '900' }],
        'display-xxl': ['96px', { lineHeight: '81.6px', fontWeight: '900' }],
        'display-xl': ['64px', { lineHeight: '54.4px', fontWeight: '900' }],
        'display-lg': ['47px', { lineHeight: '70.5px', letterSpacing: '-0.108px', fontWeight: '400' }],
        'display-md': ['40px', { lineHeight: '34px', fontWeight: '900' }],
        'display-sm': ['32px', { lineHeight: '38.4px', letterSpacing: '-0.96px', fontWeight: '600' }],
        'display-xs': ['24px', { lineHeight: '31.2px', letterSpacing: '-0.48px', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 51, 0, 0.06), 0 2px 8px rgba(22, 51, 0, 0.05)',
        'card-hover': '0 10px 28px -8px rgba(22, 51, 0, 0.22)',
        float: '0 18px 40px -14px rgba(22, 51, 0, 0.35)',
        // Elevation is mostly flat — surface contrast (canvas-soft vs canvas) IS the elevation cue.
        'tanit-card': 'none',
        'tanit-soft': 'none',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      spacing: {
        xxs: '2px',
      },
    },
  },
  plugins: [],
}
