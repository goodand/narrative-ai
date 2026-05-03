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
      // borderRadius override removed: Tailwind v4 build does not honor JS-config
      // borderRadius extends; use Tailwind default scale + arbitrary values per spec.
      // spec radius scale: 16 (rounded-2xl) / 24 (rounded-3xl) / 9999 (rounded-full).
      // sheet-top 32 -> rounded-[32px] arbitrary or @theme {--radius-sheet: 32px} extension.
    },
  },
  plugins: [],
}