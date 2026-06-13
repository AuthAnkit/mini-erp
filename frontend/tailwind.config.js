/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        erp: {
          dark: '#0f1117',
          card: '#1a1d27',
          border: '#2a2d3e',
          accent: '#6366f1',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          muted: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}
