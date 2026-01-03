  // tailwind.config.js
  module.exports = {
    content: [
      "./pages/**/*.{ts,tsx}",
      "./components/**/*.{ts,tsx}",
      "./app/**/*.{ts,tsx}",
      "./src/**/*.{ts,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          neusharp: ["Neusharp", "sans-serif"],
        },
      },
    },
  };
