/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forest: {
          900: "#102B20",
          700: "#174D38",
          500: "#246747",
        },
        lime: { 300: "#D8F27A" },
        canvas: { 50: "#F6F7F2" },
        ink: "#17251D",
        muted: "#748078",
        line: "#E5E9E1",
        sage: { 300: "#D6E6D8", 500: "#73927D" },
        accent: {
          orange: "#E98A52",
          rose: "#F6E4DB",
          blue: "#DCEBF1",
          mint: "#EAF3E8",
        },
        map: {
          land: "#E7EDE2",
          park: "#CDE3C7",
          water: "#C7E2E9",
          shape: "#DCE8D6",
        },
      },
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
