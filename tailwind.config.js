/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        'stone': {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        'sage': {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7d0c7',
          300: '#a2b2a2',
          400: '#7a907a',
          500: '#5c7359',
          600: '#485d46',
          700: '#3c4d3b',
          800: '#334032',
          900: '#2b352b',
        },
        'stress': {
          low: '#3b82f6',    // blue
          medium: '#f59e0b', // amber
          high: '#ef4444',   // red
        }
      }
    },
  },
  plugins: [],
}