/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './client/**/*.html',
    './client/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6B8E6B',
        'primary-dark': '#557855',
        'primary-light': '#C5D9C5',
        'primary-pale': '#E8F0E8',
        danger: '#D4A5A5',
        'danger-dark': '#C08E8E',
        warm: {
          50: '#FBFAF8',
          100: '#F6F3EE',
          200: '#EDE8E0',
          300: '#E0D9CE',
        },
        sage: {
          50: '#F5F8F5',
          100: '#E6EDE6',
          200: '#CED9CE',
          300: '#A8BDA8',
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'default': '0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px 0 rgba(0, 0, 0, 0.04), 0 4px 8px 0 rgba(0, 0, 0, 0.05)',
        'lg': '0 10px 15px 0 rgba(0, 0, 0, 0.04), 0 4px 10px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
