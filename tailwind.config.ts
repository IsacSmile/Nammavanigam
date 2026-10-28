import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#1A8A2E",
          "green-hover": "#147024",
          "green-light": "#EBF7ED",
          navy: "#000B4D",
          blue: "#0463A5",
          "blue-hover": "#034E82",
          "blue-light": "#EBF4FA",
          card: "#F8F9FA",
        },
      },
    },
  },
  plugins: [],
};
export default config;
