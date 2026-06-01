/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../client/**/*.html',
    '../client/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        danger: '#ef4444',
        'danger-dark': '#dc2626',
      },
    },
  },
  plugins: [],
}
