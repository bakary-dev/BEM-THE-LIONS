import type { Config } from "tailwindcss";

/**
 * Palette construite autour de l'identité BEM THE LIONS (noir profond, or « lion », orange basket).
 * Ajuster ces jetons si les couleurs du logo officiel diffèrent.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0A0A0C", 900: "#0A0A0C", 800: "#121216", 700: "#1A1A20", 600: "#24242C", 500: "#34343F" },
        gold: { DEFAULT: "#F5B700", 300: "#FFD45C", 400: "#FFC629", 500: "#F5B700", 600: "#D99A00", 700: "#A87600" },
        ball: { DEFAULT: "#FF7A1A", 500: "#FF7A1A", 600: "#E5630A" },
        mist: { DEFAULT: "#A1A1AA", 300: "#D4D4D8", 400: "#A1A1AA", 500: "#71717A" },
        success: "#22C55E",
        danger: "#EF4444",
        whatsapp: "#25D366",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(24px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pop-in": { "0%": { opacity: "0", transform: "scale(.6)" }, "70%": { opacity: "1", transform: "scale(1.08)" }, "100%": { transform: "scale(1)" } },
        "splash-logo": {
          "0%": { opacity: "0", transform: "scale(.7)" },
          "35%": { opacity: "1", transform: "scale(1)" },
          "65%": { transform: "scale(1.12)" },
          "100%": { opacity: "1", transform: "scale(1.06)" },
        },
        glow: { "0%,100%": { opacity: ".35" }, "50%": { opacity: ".7" } },
        bounce2: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        "fade-in": "fade-in .6s ease-out both",
        "slide-up": "slide-up .7s cubic-bezier(.2,.8,.2,1) both",
        "pop-in": "pop-in .6s cubic-bezier(.2,.8,.2,1) both",
        "splash-logo": "splash-logo 1.6s cubic-bezier(.2,.8,.2,1) both",
        glow: "glow 3s ease-in-out infinite",
        bounce2: "bounce2 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
