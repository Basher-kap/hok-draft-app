/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#12141a",
          panel: "#1a1e26",
          border: "rgba(255,255,255,0.08)",
        },
        role: {
          clash: "#c0392b",
          jungle: "#2e8b3d",
          mid: "#7c4dff",
          farm: "#d4a017",
          roam: "#1f8a9c",
        },
        tier: {
          s: "#f5c451",
          a: "#e0703a",
          b: "#5aa9e6",
          c: "#8a94a6",
        },
        teamA: "#3b82f6",
        teamB: "#ef4444",
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
