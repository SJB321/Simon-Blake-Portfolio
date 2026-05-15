// Curated font presets — the dropdown in the theme editor pulls from here.
//
// Each preset has:
//   - `name`: the CSS font-family value (no quotes — the consumer adds them)
//   - `kind`: 'serif' | 'sans' — so the heading/body pickers can show only the
//             appropriate options
//   - `googleFontUrl`: the Google Fonts stylesheet URL to load on the public
//             site when this preset is active. Null when the font is already
//             preloaded (e.g. Source Serif/Sans live in index.html).
//   - `pdfFallback`: name we use in the PDF when this preset is active. Most
//             presets just pass through, but custom Google Fonts can't be
//             registered in react-pdf without the TTF, so they fall back to
//             a sensible serif/sans we already bundle.

export interface FontPreset {
  name: string
  kind: 'serif' | 'sans'
  googleFontUrl: string | null
  pdfFallback?: string
}

export const HEADING_PRESETS: FontPreset[] = [
  {
    name: 'Source Serif 4',
    kind: 'serif',
    googleFontUrl: null, // already loaded in index.html
  },
  {
    name: 'Playfair Display',
    kind: 'serif',
    googleFontUrl:
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    pdfFallback: 'Source Serif 4',
  },
  {
    name: 'Lora',
    kind: 'serif',
    googleFontUrl:
      'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
    pdfFallback: 'Source Serif 4',
  },
  {
    name: 'IBM Plex Serif',
    kind: 'serif',
    googleFontUrl:
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600;700&display=swap',
    pdfFallback: 'Source Serif 4',
  },
  {
    name: 'Merriweather',
    kind: 'serif',
    googleFontUrl:
      'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
    pdfFallback: 'Source Serif 4',
  },
]

export const BODY_PRESETS: FontPreset[] = [
  {
    name: 'Source Sans 3',
    kind: 'sans',
    googleFontUrl: null,
  },
  {
    name: 'Inter',
    kind: 'sans',
    googleFontUrl:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    pdfFallback: 'Source Sans 3',
  },
  {
    name: 'IBM Plex Sans',
    kind: 'sans',
    googleFontUrl:
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
    pdfFallback: 'Source Sans 3',
  },
  {
    name: 'Work Sans',
    kind: 'sans',
    googleFontUrl:
      'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap',
    pdfFallback: 'Source Sans 3',
  },
  {
    name: 'Nunito',
    kind: 'sans',
    googleFontUrl:
      'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap',
    pdfFallback: 'Source Sans 3',
  },
]

export const SPACING_OPTIONS = ['compact', 'comfortable', 'spacious'] as const
export type SpacingOption = (typeof SPACING_OPTIONS)[number]

/** Multiplier applied to the section padding CSS variable. */
export const SPACING_SCALE: Record<SpacingOption, number> = {
  compact: 0.65,
  comfortable: 1,
  spacious: 1.35,
}

/** Find the preset that matches a font-family name (case-insensitive). */
export function findPreset(
  name: string,
  list: FontPreset[],
): FontPreset | undefined {
  const lower = name.trim().toLowerCase()
  return list.find((p) => p.name.toLowerCase() === lower)
}
