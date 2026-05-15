// Applies a Theme to the live document.
//
// Mechanism: sets CSS custom properties on <body> (`--theme-accent`,
// `--theme-heading-font`, etc.) and ensures any required Google Fonts
// stylesheet is loaded. Tailwind classes for accent/fonts read these vars
// (see tailwind.config.js) so existing markup re-themes without changes.
//
// Only the public site calls applyTheme. The edit page deliberately doesn't
// — keeps the admin UI in a stable visual baseline regardless of theme.

import type { Theme } from '../types/resume'
import { SPACING_SCALE, type SpacingOption } from './fontPresets'

const LINK_TAG_ID_PREFIX = 'theme-font-'

/** Active set of font URL tags we've appended to <head>; tracked so we can
 *  remove ones that are no longer used and avoid re-adding duplicates. */
function ensureFontLink(url: string, key: string): void {
  const id = `${LINK_TAG_ID_PREFIX}${key}`
  const existing = document.getElementById(id) as HTMLLinkElement | null
  if (existing && existing.href === url) return
  if (existing) existing.remove()
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
}

function removeFontLink(key: string): void {
  const el = document.getElementById(`${LINK_TAG_ID_PREFIX}${key}`)
  if (el) el.remove()
}

/**
 * Eagerly load a Google Fonts stylesheet so the editor preview can render
 * with the actual font. Idempotent — multiple calls with the same URL just
 * leave the existing tag in place. Distinct from applyTheme's font links
 * (which use reserved keys 'heading' and 'body') by using a 'preview-' prefix.
 */
export function preloadFontForPreview(url: string | null | undefined): void {
  if (!url) return
  const key = `preview-${hash(url)}`
  ensureFontLink(url, key)
}

function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

/**
 * Set the CSS variables that drive Tailwind's accent/font/spacing utilities,
 * plus load any required Google Fonts stylesheet. Returns a function that
 * resets everything back to defaults — call on unmount.
 */
export function applyTheme(theme: Theme | null): () => void {
  const body = document.body

  if (!theme) {
    clearThemeVars()
    return () => {} // nothing to undo
  }

  // CSS variables — typography, colors, and spacing scale.
  body.style.setProperty('--theme-accent', theme.accentColor)
  body.style.setProperty('--theme-bg', theme.backgroundColor)
  body.style.setProperty('--theme-card-bg', theme.cardBackgroundColor)
  body.style.setProperty('--theme-card-border', theme.cardBorderColor)
  body.style.setProperty(
    '--theme-heading-font',
    quoteFontName(theme.headingFont),
  )
  body.style.setProperty('--theme-body-font', quoteFontName(theme.bodyFont))
  const spacing = (theme.spacing as SpacingOption) || 'comfortable'
  const scale = SPACING_SCALE[spacing] ?? 1
  body.style.setProperty('--theme-section-scale', String(scale))

  // Google Fonts (if any)
  if (theme.headingFontUrl) {
    ensureFontLink(theme.headingFontUrl, 'heading')
  } else {
    removeFontLink('heading')
  }
  if (theme.bodyFontUrl) {
    ensureFontLink(theme.bodyFontUrl, 'body')
  } else {
    removeFontLink('body')
  }

  return () => clearThemeVars()
}

function clearThemeVars(): void {
  const body = document.body
  body.style.removeProperty('--theme-accent')
  body.style.removeProperty('--theme-bg')
  body.style.removeProperty('--theme-card-bg')
  body.style.removeProperty('--theme-card-border')
  body.style.removeProperty('--theme-heading-font')
  body.style.removeProperty('--theme-body-font')
  body.style.removeProperty('--theme-section-scale')
  removeFontLink('heading')
  removeFontLink('body')
}

/** Wrap a font name in quotes if it contains spaces. */
function quoteFontName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  if (/^['"].*['"]$/.test(trimmed)) return trimmed
  return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed
}
