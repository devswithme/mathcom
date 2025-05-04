/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          background: "var(--background)",
          foreground: "var(--foreground)",
          card: "var(--card)",
          "card-foreground": "var(--card-foreground)",
          primary: "var(--primary)",
          "primary-foreground": "var(--primary-foreground)",
          secondary: "var(--secondary)",
          "secondary-foreground": "var(--secondary-foreground)",
          border: "var(--border)",
          input: "var(--input)",
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 0.125rem)",
          sm: "calc(var(--radius) - 0.25rem)",
        },
      },
    },
    plugins: [],
  };