/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        retro: ['"Space Grotesk"', 'sans-serif'],
        handwriting: ['"Caveat"', 'cursive'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'flash': 'flashAnimation 0.6s ease-out',
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        flashAnimation: {
          '0%': { opacity: '0.9', backgroundColor: '#ffffff' },
          '100%': { opacity: '0', backgroundColor: '#ffffff' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
