/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./public/**/*.{html,js}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        }
      }
    }
  },
  plugins: [],
}
