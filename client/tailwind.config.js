/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Editorial palette. The two accents are wayfinding, not decoration:
        // innovator-side content is brass, student-side content is teal.
        paper: '#F6F5F1',
        ink: {
          DEFAULT: '#1B2A4A',
          light: '#4A5A7A',
        },
        innovator: '#B8863B',
        student: '#2F6F6D',
        line: '#D8DBD6',
      },
      fontFamily: {
        // Inter is the default (font-sans); the serif is for headlines only.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        // 4px instead of the rounder "SaaS card" default.
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
}
