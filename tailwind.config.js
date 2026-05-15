/** @type {import('tailwindcss').Config} */
//
// Accent color and the serif/sans font families are themable via CSS custom
// properties applied to <body> by src/lib/themeRuntime.ts. The fallback
// inside each `var(...)` is the original hardcoded value, so any page that
// doesn't apply a theme (the edit page) renders exactly as before.
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--theme-body-font, "Source Sans 3")',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'var(--theme-heading-font, "Source Serif 4")',
          'ui-serif',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif',
        ],
      },
      colors: {
        accent: {
          DEFAULT: 'var(--theme-accent, #1e3a5f)',
          soft: 'var(--theme-accent-soft, #3a587c)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.7s ease-out both',
        'fade-up': 'fadeUp 0.7s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
