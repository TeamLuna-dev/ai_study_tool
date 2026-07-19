/** @type {import('tailwindcss').Config} */

// Single gold ramp, anchored at 600 = #AB7E0C (the pinned accent).
// Reused below to collapse every legacy accent hue into one brand voice.
const gilt = {
  50: "#FBF6E9",
  100: "#F5EDD8",
  200: "#EAD9AC",
  300: "#DCC17A",
  400: "#CBA544",
  500: "#B98E1C",
  600: "#AB7E0C",
  700: "#8A6608",
  800: "#6E5109",
  900: "#5A420C",
  950: "#33260A",
};

// Warm neutral ramp — replaces the default cool-blue-tinted gray.
const warmGray = {
  50: "#FAF9F6",
  100: "#F3F1EB",
  200: "#E7E3D8",
  300: "#D3CDBE",
  400: "#A79E8B",
  500: "#837B69",
  600: "#6E6656",
  700: "#514B3E",
  800: "#322C1F",
  900: "#201B12",
  950: "#141109",
};

export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Named semantic tokens (light theme values; dark theme is
        // applied via `.dark:` variants at the component level).
        paper: "#FCFBF8",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1A160D",
          soft: "#6E6656",
          faint: "#A79E8B",
        },
        hairline: "#ECE7DA",
        gilt: {
          ...gilt,
          ink: "#8A6608",
          wash: "#F5EDD8",
        },
        "on-gilt": "#FFFFFF",

        // Collapse every legacy multi-hue accent into the one gold voice.
        primary: gilt,
        secondary: gilt,
        blue: gilt,
        sky: gilt,
        indigo: gilt,
        purple: gilt,
        violet: gilt,
        fuchsia: gilt,
        cyan: gilt,

        // Warm the neutral ramp so gray-950 etc. read warm, not cool-blue.
        gray: warmGray,

        // Semantic status colors (success/error/warning) keep Tailwind
        // defaults — they are not the brand accent.
      },
      fontFamily: {
        display: ["Fraunces", "Iowan Old Style", "Palatino", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      // Shared entrance motion for auth/onboarding cards.
      keyframes: {
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-slide-up": "fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
}
