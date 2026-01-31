/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./new_design/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#B2A5CF",
        "dark-bg": "#121212",
        "field-bg": "#1E1E1E",
        "muted-lavender": "#A199B4",
        "brand": "#B2A5CF" // Keeping alias for compatibility if needed
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "Noto Sans KR", "sans-serif"],
        "sans": ["Plus Jakarta Sans", "Noto Sans KR", "sans-serif"]
      },
      borderRadius: {
        "lg": "2rem",
        "xl": "3rem"
      },
    },
  },
  plugins: [],
}