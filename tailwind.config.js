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
        // Override the stone palette so text colors theme automatically.
        // Each shade reads from a CSS var with the original stone hex as the
        // fallback — meaning the edit page (which never sets these vars)
        // renders identically to the unthemed default. The public site, when
        // a theme is active, picks up the theme's text colors via the vars
        // set by themeRuntime.ts.
        //
        // Three knobs map to the six text-stone-* shades used across the site:
        //   --theme-text       → headings/strong (900, 800)
        //   --theme-text-body  → body/paragraphs (700, 600)
        //   --theme-text-muted → labels/metadata/faint icons (500, 400, 300)
        // Shades 200/100/50 stay hardcoded since they're used as background
        // fills and borders, not text — handled separately via card vars.
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: 'var(--theme-text-muted, #d6d3d1)',
          400: 'var(--theme-text-muted, #a8a29e)',
          500: 'var(--theme-text-muted, #78716c)',
          600: 'var(--theme-text-body, #57534e)',
          700: 'var(--theme-text-body, #44403c)',
          800: 'var(--theme-text, #292524)',
          900: 'var(--theme-text, #1c1917)',
          950: 'var(--theme-text, #0c0a09)',
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
