/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: "rgba(255, 255, 255, 0.45)",
          border: "rgba(255, 255, 255, 0.25)",
        },
        pastel: {
          blue: "#EBF3FF",
          pink: "#FFF0F5",
          purple: "#F3EFFF",
          green: "#E8F8F0",
          yellow: "#FFFDF0",
        },
        brand: {
          primary: "#6366F1", // Sleek Indigo
          secondary: "#4F46E5",
          accent: "#EC4899", // Vibrant Pink
        }
      },
      boxShadow: {
        premium: "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
        glass: "0 4px 30px rgba(0, 0, 0, 0.03)",
      },
      backdropBlur: {
        premium: "16px",
      }
    },
  },
  plugins: [],
}
