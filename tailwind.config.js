/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            DEFAULT: '#b5838d', // Dusty Rose
            light: '#ffb5a7',   // Blush Pink
            cream: '#faf8f5',   // Warm Cream background
          },
          secondary: {
            DEFAULT: '#2b221f', // Charcoal / Dark Mocha
            light: '#594a42',
          },
          accent: {
            DEFAULT: '#cc704b', // Terracotta
            gold: '#d4a373',      // Accent Gold
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        serif: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      spacing: {
        '8': '8px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
      }
    },
  },
  plugins: [],
}
