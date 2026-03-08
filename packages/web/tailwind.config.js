/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f2ede4',
        paper2: '#e8e2d6',
        ink: '#0a0a08',
        accent: '#c8371a',
        accent2: '#1a4dc8',
        live: '#1a8c3a',
        warn: '#c87c1a',
        muted: '#6b6558',
        code: '#1a1a16',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
}
