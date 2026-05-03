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
        "dark-bg": "#0F0E10",
        "field-bg": "#1C1B1E",
        "muted-lavender": "#A199B4",
        "brand": "#B2A5CF" // Keeping alias for compatibility if needed
      },
      fontFamily: {
        "display": ["Pretendard", "Plus Jakarta Sans", "sans-serif"],
        "sans": ["Pretendard", "Plus Jakarta Sans", "sans-serif"]
      },
      borderRadius: {
        "lg": "2rem",
        "xl": "3rem"
      },
    },
  },
  plugins: [],
}