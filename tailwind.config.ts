/** @type {import('tailwindcss').Config} */
/**module.exports = {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}
*/

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#10B981', // Emerald 500
        'secondary-green': '#059669', // Emerald 600
        'soil-brown': '#A0522D', // Sienna
        'sky-blue': '#3B82F6', // Blue 500
        'field-gray': '#E5E7EB', // Gray 200 for map background
        'llm-purple': '#8B5CF6', // New color for AI features
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
