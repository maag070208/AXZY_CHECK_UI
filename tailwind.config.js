/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@axzydev/axzy_ui_system/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /col-span-(1|2|3|4|6|8|12)/,
      variants: ["sm", "md", "lg"],
    },
    {
      pattern:
        /^(border|text)-(blue|gray|green|red|yellow|purple)-(700|50|600|900|800|300|400)$/,
    },
    {
      pattern:
        /^(hover:bg|focus:ring)-(blue|gray|green|red|yellow|purple)-(50|300|700|800|900)$/,
    },
    {
      pattern: /^hover:underline$/, // Clase de Tailwind para subrayado al pasar el mouse
    },
    {
      pattern: /^bg-opacity-10$/, // Clase para la opacidad de fondo
    },
  ],
  theme: {
    extend: {
      animation: {
        progress: "progress 1.5s ease-in-out infinite",
      },
      keyframes: {
        progress: {
          "0%": { width: "0%" },
          "50%": { width: "100%" },
          "100%": { width: "0%", marginLeft: "100%" },
        },
      },
    },
  },
  plugins: [],
};
