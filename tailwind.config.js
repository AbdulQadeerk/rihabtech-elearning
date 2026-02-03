/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Replace these with your brand colors
        primary: {
          DEFAULT: "#FF7700",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#EEEEEE",
          foreground: "#000000",
        },
        background: "#F9FAFB",
        muted: "#E5E7EB",
        accent: "#FF7700",
      },
    },
  },
  plugins: [
    
  ],
}
