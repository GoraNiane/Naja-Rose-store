/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#FDF8F7',
          100: '#FAF0EE',
          200: '#F5DCD8',
          300: '#EEBDB6',
          400: '#DE9990',
          500: '#C96B63',
          600: '#A8454D',
          700: '#8B3A4A',
          800: '#722E3C',
          900: '#54202B',
          950: '#331119',
        },
        naja: {
          pink: '#FDF0EE',
          light: '#FAF5F4',
          card: '#FFFFFF',
          dark: '#2C1E21',
          pill: '#382B2F',
          cta: '#8B3A4A',
          'cta-hover': '#772F3E',
          'badge-pink': '#E7A8B4',
          'badge-pink-hover': '#D48B99',
          border: '#F4E2E0',
          gold: '#F59E0B',
        },
        brand: {
          50: '#FDF8F7',
          100: '#FAF0EE',
          200: '#F5DCD8',
          300: '#EEBDB6',
          400: '#DE9990',
          500: '#C96B63',
          600: '#8B3A4A',
          700: '#722E3C',
          800: '#54202B',
          900: '#382B2F',
          950: '#2C1E21',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
        script: ['Alex Brush', 'Caveat', 'cursive'],
        handwriting: ['Caveat', 'cursive'],
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(139, 58, 74, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'luxury-hover': '0 20px 40px -15px rgba(139, 58, 74, 0.18), 0 8px 12px -4px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
