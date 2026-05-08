/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        paper: "#eef3f2",
        sea: "#0a6b6f",
        coral: "#d95f43",
        fern: "#426b45",
        grape: "#6f4a8e",
      },
      boxShadow: {
        panel: "0 18px 60px rgba(25, 28, 33, 0.12)",
      },
    },
  },
  plugins: [],
};
