/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./static/**/*.js"],
  theme: {
    extend: {
      colors: {
        'deep-space': '#1E4CAD',
        'cosmic-blue': '#2A3A7E',
        'neon-cyan': '#08F7FE',
        'neon-pink': '#FF2A6D',
        'star-white': '#FFFFFF',
        'chat-bg': '#F0F0F0',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      height: {
        '20': '5rem',
        '6': '1.5rem',
        '120': '30rem',
        '144': '36rem',
      },
      maxWidth: {
        '2xl': '42rem',
        '3xl': '52rem',
        '90%': '90%',
      },
    },
  },
  plugins: [],
}
