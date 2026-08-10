/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ffeeee',
          100: '#ffd9d9',
          200: '#ffbcbc',
          300: '#ff8e8e',
          400: '#ff5959',
          500: '#ff3333',
          600: '#f51d1d',
          700: '#df1515',
          800: '#b41717',
          900: '#8e1919',
          950: '#571414',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d9e2',
          300: '#aeb7c8',
          400: '#8190a9',
          500: '#62728f',
          600: '#4d5b76',
          700: '#3f4a61',
          800: '#374052',
          900: '#1f2533',
          950: '#0f131c',
        },
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
