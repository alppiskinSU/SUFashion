/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#EDEAE9",
        "surface-container": "#e5e1e0", // slightly darker than EDEAE9
        "surface-container-low": "#edeae9",
        "surface-container-high": "#dcd8d7",
        "surface-container-highest": "#dcd8d7",
        "surface-container-lowest": "#ffffff",
        "surface-dim": "#dcd8d7",
        primary: "#2B2B2B",
        "on-primary": "#ffffff",
        secondary: "#FFDE59",
        "secondary-container": "#FFDE59",
        "on-secondary-container": "#2B2B2B",
        "outline-variant": "#c4c7c7",
        outline: "#747878",
        background: "#EDEAE9"
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Noto Serif"', 'serif'],
        sans: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'ghost': '0px 24px 48px rgba(28, 28, 27, 0.06)',
      },
      transitionTimingFunction: {
        'heavy': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      spacing: {
        '8': '2rem',   // standard spacing
        '10': '2.5rem',// standard spacing
        '20': '7rem',  // brand breathe spacing
      },
      borderRadius: {
        'none': '0px',
        'sm': '0px',
        DEFAULT: '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
        'full': '0px',
      }
    },
  },
  plugins: [],
}
