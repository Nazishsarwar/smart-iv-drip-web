/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2B6CB0",
        "primary-dark": "#1A4971",
        accent: "#0D9488",
        surface: "#FFFFFF",
        "surface-alt": "#F7F9FC",
        "status-ok": "#16A34A",
        "status-warn": "#EA8C00",
        "status-critical": "#DC2626",
        "status-offline": "#94A3B8",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
        border: "#E5E7EB",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        control: "10px",
      },
    },
  },
  plugins: [],
};
