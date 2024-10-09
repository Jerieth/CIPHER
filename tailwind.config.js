/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./static/**/*.js"],
  theme: {
    extend: {
      colors: {
        'deep-space': '#0B3D91',
        'cosmic-blue': '#1E2761',
        'neon-cyan': '#08F7FE',
        'neon-pink': '#FF2A6D',
        'star-white': '#FFFFFF',
        'chat-bg': '#FFFFFF',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
