/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core
        surface: "#f8f9fa",                          // palitan ng tamang hex
        "on-surface": "#1a1c1e",
        "on-surface-variant": "#43474e",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",

        // Primary
        primary: "#0b3d2e",
        "on-primary": "#ffffff",
        "primary-container": "#2f6653",
        "on-primary-container": "#ffffff",

        // Secondary
        secondary: "#3d8a6e",
        "on-secondary": "#ffffff",
        "secondary-container": "#b8e6d2",
        "secondary-fixed": "#b8e6d2",
        "on-secondary-fixed-variant": "#1e4a3a",

        // Tertiary
        tertiary: "#5b4a8a",
        "on-tertiary": "#ffffff",
      },
      fontFamily: {
        "body-md": ["Inter", "system-ui", "sans-serif"],
        "body-sm": ["Inter", "system-ui", "sans-serif"],
        "label-md": ["Inter", "system-ui", "sans-serif"],
        "label-sm": ["Inter", "system-ui", "sans-serif"],
        "headline-lg": ["Inter", "system-ui", "sans-serif"],
        "headline-sm": ["Inter", "system-ui", "sans-serif"],
        "code-sm": ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "body-md": ["16px", { lineHeight: "1.5" }],
        "body-sm": ["14px", { lineHeight: "1.4" }],
        "label-md": ["14px", { lineHeight: "1.4" }],
        "label-sm": ["12px", { lineHeight: "1.3" }],
        "headline-lg": ["32px", { lineHeight: "1.2" }],
        "headline-sm": ["20px", { lineHeight: "1.3" }],
        "code-sm": ["13px", { lineHeight: "1.4" }],
      },
      spacing: {
        "space-xs": "8px",
        "space-sm": "16px",
        "space-md": "24px",
        "space-lg": "32px",
        "space-xl": "48px",
        "gutter": "24px",
      },
    },
  },
  plugins: [],
};