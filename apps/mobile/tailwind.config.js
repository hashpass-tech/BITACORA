/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        page: "#faf8ff",
        card: "#ffffff",
        primary: "#2d2540",
        muted: "#6b7280",
        accent: "#7C3AED",
        "accent-light": "rgba(124,58,237,0.08)",
        "accent-mid": "rgba(124,58,237,0.18)",
        border: "rgba(45,37,64,0.10)",
      },
      fontFamily: {
        sans: ["IBMPlexSans", "sans-serif"],
        mono: ["IBMPlexMono", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
    },
  },
  plugins: [],
};
