/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0c0a09',
          900: '#141211',
          850: '#1a1816',
          800: '#262422',
          700: '#383532',
          600: '#524e4a',
        },
        burnt: {
          light: '#fb923c',
          DEFAULT: '#f97316',
          dark: '#cc5500',
          deep: '#9a3412',
        },
        cyanic: {
          light: '#67e8f9',
          DEFAULT: '#06b6d4',
          dark: '#0891b2',
        },
        crisp: '#f9f9f9',
        subtle: '#a8a29e',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
