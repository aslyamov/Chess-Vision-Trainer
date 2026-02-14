/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.ts'],
  theme: {
    extend: {
      colors: {
        chess: {
          board: '#b58863',
          dark: '#262421',
          highlight: '#a7c5eb'
        }
      }
    }
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark'],
  }
}
