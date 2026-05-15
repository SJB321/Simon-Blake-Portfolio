// Create / edit a theme. Modal form with all the visual knobs.

import { useEffect, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { api, type ThemeInput } from '../../lib/api'
import {
  HEADING_PRESETS,
  BODY_PRESETS,
  SPACING_OPTIONS,
  SPACING_SCALE,
  findPreset,
  type FontPreset,
  type SpacingOption,
} from '../../lib/fontPresets'
import { preloadFontForPreview } from '../../lib/themeRuntime'
import type { Theme } from '../../types/resume'

interface ThemeEditorProps {
  mode: 'create' | 'edit'
  theme?: Theme
  password: string | undefined
  onClose: () => void
  onSaved: () => void | Promise<void>
}

interface DraftState {
  name: string
  description: string
  headingMode: 'preset' | 'custom'
  headingFont: string
  headingFontUrl: string
  bodyMode: 'preset' | 'custom'
  bodyFont: string
  bodyFontUrl: string
  accentColor: string
  backgroundColor: string
  cardBackgroundColor: string
  cardBorderColor: string
  spacing: SpacingOption
}

function initialDraft(theme?: Theme): DraftState {
  if (theme) {
    const headingPreset = findPreset(theme.headingFont, HEADING_PRESETS)
    const bodyPreset = findPreset(theme.bodyFont, BODY_PRESETS)
    const spacing: SpacingOption = (SPACING_OPTIONS as readonly string[]).includes(
      theme.spacing,
    )
      ? (theme.spacing as SpacingOption)
      : 'comfortable'
    return {
      name: theme.name,
      description: theme.description ?? '',
      headingMode: headingPreset ? 'preset' : 'custom',
      headingFont: theme.headingFont,
      headingFontUrl: theme.headingFontUrl ?? '',
      bodyMode: bodyPreset ? 'preset' : 'custom',
      bodyFont: theme.bodyFont,
      bodyFontUrl: theme.bodyFontUrl ?? '',
      accentColor: normalizeHex(theme.accentColor),
      backgroundColor: normalizeHex(theme.backgroundColor),
      cardBackgroundColor: normalizeHex(theme.cardBackgroundColor),
      cardBorderColor: normalizeHex(theme.cardBorderColor),
      spacing,
    }
  }
  return {
    name: '',
    description: '',
    headingMode: 'preset',
    headingFont: HEADING_PRESETS[0].name,
    headingFontUrl: '',
    bodyMode: 'preset',
    bodyFont: BODY_PRESETS[0].name,
    bodyFontUrl: '',
    accentColor: '#1e3a5f',
    backgroundColor: '#fafaf9',
    cardBackgroundColor: '#ffffff',
    cardBorderColor: '#e7e5e4',
    spacing: 'comfortable',
  }
}

export default function ThemeEditor({
  mode,
  theme,
  password,
  onClose,
  onSaved,
}: ThemeEditorProps) {
  const [draft, setDraft] = useState<DraftState>(() => initialDraft(theme))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preview can't render a font that hasn't been loaded yet. Eagerly load
  // the stylesheet for the currently-selected fonts so the preview reflects
  // them live. Idempotent — switching presets just adds another <link>.
  useEffect(() => {
    if (draft.headingMode === 'preset') {
      const preset = findPreset(draft.headingFont, HEADING_PRESETS)
      preloadFontForPreview(preset?.googleFontUrl ?? null)
    } else {
      preloadFontForPreview(draft.headingFontUrl || null)
    }
  }, [draft.headingMode, draft.headingFont, draft.headingFontUrl])

  useEffect(() => {
    if (draft.bodyMode === 'preset') {
      const preset = findPreset(draft.bodyFont, BODY_PRESETS)
      preloadFontForPreview(preset?.googleFontUrl ?? null)
    } else {
      preloadFontForPreview(draft.bodyFontUrl || null)
    }
  }, [draft.bodyMode, draft.bodyFont, draft.bodyFontUrl])

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (!draft.name.trim()) {
      setError('Name is required.')
      return
    }
    const hexRe = /^#([0-9a-fA-F]{3}){1,2}$/
    const colorChecks: Array<[label: string, value: string]> = [
      ['Accent color', draft.accentColor],
      ['Background color', draft.backgroundColor],
      ['Card background color', draft.cardBackgroundColor],
      ['Card border color', draft.cardBorderColor],
    ]
    for (const [label, value] of colorChecks) {
      if (!hexRe.test(value)) {
        setError(`${label} must be a hex value like #1e3a5f.`)
        return
      }
    }
    if (draft.headingMode === 'custom' && !draft.headingFont.trim()) {
      setError('Custom heading font name cannot be empty.')
      return
    }
    if (draft.bodyMode === 'custom' && !draft.bodyFont.trim()) {
      setError('Custom body font name cannot be empty.')
      return
    }
    // Quick sanity check on custom Google Fonts URLs. We don't enforce the
    // exact /css2?family=... shape since the user might paste @import or
    // any other valid Google Fonts URL — but we do require it parse as an
    // https URL to catch obvious typos.
    if (
      draft.headingMode === 'custom' &&
      draft.headingFontUrl &&
      !isValidFontUrl(draft.headingFontUrl)
    ) {
      setError(
        'Heading font URL doesn\'t look right. Paste the Google Fonts URL from the "Get embed code" panel.',
      )
      return
    }
    if (
      draft.bodyMode === 'custom' &&
      draft.bodyFontUrl &&
      !isValidFontUrl(draft.bodyFontUrl)
    ) {
      setError(
        'Body font URL doesn\'t look right. Paste the Google Fonts URL from the "Get embed code" panel.',
      )
      return
    }

    const payload = buildPayload(draft)

    setSubmitting(true)
    try {
      if (mode === 'create') {
        await api.createTheme(payload, password)
      } else if (theme) {
        await api.updateTheme(theme.id, payload, password)
      }
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-2xl max-h-full flex flex-col rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden"
      >
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <h2 className="font-serif text-lg font-semibold text-stone-900">
            {mode === 'create' ? 'New theme' : `Edit · ${theme?.name}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-auto p-5 space-y-5">
          <Field label="Name *">
            <Input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Modern Editorial"
            />
          </Field>
          <Field label="Description" hint="Shown on the theme card to help you remember what this look is.">
            <Input
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Warm editorial — Playfair headings, soft red accent."
            />
          </Field>

          <FontPickerField
            label="Heading font"
            presets={HEADING_PRESETS}
            mode={draft.headingMode}
            font={draft.headingFont}
            fontUrl={draft.headingFontUrl}
            onModeChange={(m) => {
              if (m === 'preset' && draft.headingMode !== 'preset') {
                set('headingFont', HEADING_PRESETS[0].name)
                set('headingFontUrl', '')
              }
              set('headingMode', m)
            }}
            onFontChange={(name) => {
              set('headingFont', name)
              if (draft.headingMode === 'preset') {
                const preset = findPreset(name, HEADING_PRESETS)
                set('headingFontUrl', preset?.googleFontUrl ?? '')
              }
            }}
            onFontUrlChange={(url) => set('headingFontUrl', url)}
          />

          <FontPickerField
            label="Body font"
            presets={BODY_PRESETS}
            mode={draft.bodyMode}
            font={draft.bodyFont}
            fontUrl={draft.bodyFontUrl}
            onModeChange={(m) => {
              if (m === 'preset' && draft.bodyMode !== 'preset') {
                set('bodyFont', BODY_PRESETS[0].name)
                set('bodyFontUrl', '')
              }
              set('bodyMode', m)
            }}
            onFontChange={(name) => {
              set('bodyFont', name)
              if (draft.bodyMode === 'preset') {
                const preset = findPreset(name, BODY_PRESETS)
                set('bodyFontUrl', preset?.googleFontUrl ?? '')
              }
            }}
            onFontUrlChange={(url) => set('bodyFontUrl', url)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Accent color"
              hint="Buttons, links, eyebrows, PDF headings."
              value={draft.accentColor}
              onChange={(v) => set('accentColor', v)}
            />
            <ColorField
              label="Page background"
              hint="The body color behind everything."
              value={draft.backgroundColor}
              onChange={(v) => set('backgroundColor', v)}
            />
            <ColorField
              label="Box background"
              hint="Card surfaces — projects, education, contact, skills."
              value={draft.cardBackgroundColor}
              onChange={(v) => set('cardBackgroundColor', v)}
            />
            <ColorField
              label="Box border"
              hint="Outline color around cards."
              value={draft.cardBorderColor}
              onChange={(v) => set('cardBorderColor', v)}
            />
          </div>

          <Field label="Spacing">
            <div className="flex gap-2">
              {SPACING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set('spacing', opt)}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    draft.spacing === opt
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-stone-300 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>

          <ThemePreview draft={draft} />

          <ContrastWarning draft={draft} />

          {error && (
            <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-stone-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-sm disabled:opacity-60 disabled:cursor-wait"
          >
            {submitting
              ? 'Saving…'
              : mode === 'create'
                ? 'Create theme'
                : 'Save changes'}
          </button>
        </footer>
      </form>
    </div>
  )
}

/* ───────────────────────────── helpers ───────────────────────────── */

function buildPayload(draft: DraftState): ThemeInput {
  // For preset mode, look the preset back up to recover its Google Fonts URL
  // (so a saved theme always has the URL needed to load itself on the public
  // site, regardless of what was typed manually).
  let headingFont = draft.headingFont
  let headingFontUrl: string | null = draft.headingFontUrl || null
  if (draft.headingMode === 'preset') {
    const p = findPreset(headingFont, HEADING_PRESETS)
    headingFontUrl = p?.googleFontUrl ?? null
  }

  let bodyFont = draft.bodyFont
  let bodyFontUrl: string | null = draft.bodyFontUrl || null
  if (draft.bodyMode === 'preset') {
    const p = findPreset(bodyFont, BODY_PRESETS)
    bodyFontUrl = p?.googleFontUrl ?? null
  }

  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    headingFont: headingFont.trim(),
    headingFontUrl,
    bodyFont: bodyFont.trim(),
    bodyFontUrl,
    accentColor: normalizeHex(draft.accentColor),
    backgroundColor: normalizeHex(draft.backgroundColor),
    cardBackgroundColor: normalizeHex(draft.cardBackgroundColor),
    cardBorderColor: normalizeHex(draft.cardBorderColor),
    spacing: draft.spacing,
  }
}

function normalizeHex(v: string): string {
  const s = v.trim()
  if (!s) return '#000000'
  return s.startsWith('#') ? s : `#${s}`
}

/** True if the string parses as an http(s) URL — used to gate custom Google
 *  Fonts URL inputs against typos. */
function isValidFontUrl(s: string): boolean {
  try {
    const u = new URL(s.trim())
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Extract a font family name from a Google Fonts URL.
 * Examples:
 *   https://fonts.googleapis.com/css2?family=Bebas+Neue              → "Bebas Neue"
 *   https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700   → "Fraunces"
 *   https://fonts.googleapis.com/css?family=Lora|Inter               → "Lora"
 * Returns null if the URL has no `family` query parameter.
 */
export function parseFontNameFromUrl(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url.trim())
    const family = u.searchParams.get('family')
    if (!family) return null
    // Strip any :weight / :ital,wght suffix, normalize '+' → space,
    // and if the URL bundles multiple families (separated by '|'), pick the
    // first one — it's the heading font in most preset pages.
    const first = family.split('|')[0]
    const name = first.split(':')[0].replace(/\+/g, ' ').trim()
    return name || null
  } catch {
    return null
  }
}

/* ───────────────────────────── sub-components ───────────────────────────── */

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-stone-300 bg-white"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
          placeholder="#1e3a5f"
        />
      </div>
    </Field>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-stone-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="block mt-1 text-[11px] text-stone-500">{hint}</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm placeholder-stone-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
        props.className || ''
      }`}
    />
  )
}

interface FontPickerFieldProps {
  label: string
  presets: FontPreset[]
  mode: 'preset' | 'custom'
  font: string
  fontUrl: string
  onModeChange: (mode: 'preset' | 'custom') => void
  onFontChange: (name: string) => void
  onFontUrlChange: (url: string) => void
}

function FontPickerField({
  label,
  presets,
  mode,
  font,
  fontUrl,
  onModeChange,
  onFontChange,
  onFontUrlChange,
}: FontPickerFieldProps) {
  return (
    <Field
      label={label}
      hint={
        mode === 'custom'
          ? 'Type any Google Font family name (e.g. "Bebas Neue"). The PDF will fall back to a built-in serif/sans for safety.'
          : 'Curated set — these load fast and work in both the live site and the PDF.'
      }
    >
      <div className="space-y-2">
        <div className="inline-flex rounded-md border border-stone-300 p-0.5 bg-stone-50">
          <button
            type="button"
            onClick={() => onModeChange('preset')}
            className={`px-3 py-1 text-xs rounded ${
              mode === 'preset'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Preset
          </button>
          <button
            type="button"
            onClick={() => onModeChange('custom')}
            className={`px-3 py-1 text-xs rounded ${
              mode === 'custom'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Custom (Google Fonts)
          </button>
        </div>

        {mode === 'preset' ? (
          <select
            value={font}
            onChange={(e) => onFontChange(e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {presets.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <CustomFontInput
            font={font}
            fontUrl={fontUrl}
            onFontChange={onFontChange}
            onFontUrlChange={onFontUrlChange}
          />
        )}
      </div>
    </Field>
  )
}

interface CustomFontInputProps {
  font: string
  fontUrl: string
  onFontChange: (name: string) => void
  onFontUrlChange: (url: string) => void
}

/**
 * Single-input custom-font UI. The user pastes a Google Fonts URL; we parse
 * the family name out of `?family=...` and write it back into the font name
 * state automatically. Eliminates the previous mismatch bug where users could
 * paste `?family=Lora` while typing "Bebas Neue" as the name, then save a
 * theme that loaded one font but referenced another in CSS.
 *
 * We still expose the parsed name as read-only feedback so the user can
 * verify what got detected before saving.
 */
function CustomFontInput({
  font,
  fontUrl,
  onFontChange,
  onFontUrlChange,
}: CustomFontInputProps) {
  // Whenever the URL changes, derive the family name and push it up.
  // Effect (not render-time call) so we don't fight controlled-input
  // re-render ordering.
  useEffect(() => {
    const parsed = parseFontNameFromUrl(fontUrl)
    if (parsed && parsed !== font) {
      onFontChange(parsed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontUrl])

  const parsed = parseFontNameFromUrl(fontUrl)
  const urlLooksValid = !fontUrl || isValidFontUrl(fontUrl)

  return (
    <div className="space-y-2">
      <Input
        value={fontUrl}
        onChange={(e) => onFontUrlChange(e.target.value)}
        placeholder="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
      />
      {/* Live status — what we detected, or a helpful nudge */}
      {fontUrl ? (
        parsed ? (
          <p className="text-[11px] text-stone-500">
            Detected family: <strong className="text-stone-800">{parsed}</strong>
            {!urlLooksValid && (
              <span className="ml-2 text-amber-700">
                URL doesn't parse — check for typos.
              </span>
            )}
          </p>
        ) : (
          <p className="text-[11px] text-amber-700">
            Couldn't detect a font name. Make sure the URL has a{' '}
            <code className="bg-amber-50 px-1 rounded">?family=Name</code> query
            parameter.
          </p>
        )
      ) : (
        <p className="text-[11px] text-stone-500">
          Find a URL on{' '}
          <a
            href="https://fonts.google.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-accent"
          >
            fonts.google.com
          </a>{' '}
          → pick a family → "Get embed code → @import / link" → copy the URL
          (just the URL, not the whole tag).
        </p>
      )}
      {/* Editable font name — pre-filled from parse, can be tweaked */}
      <div>
        <span className="block text-[11px] text-stone-500 mb-1">
          Font name used in CSS (auto-detected from URL):
        </span>
        <Input
          value={font}
          onChange={(e) => onFontChange(e.target.value)}
          placeholder="Bebas Neue"
        />
      </div>
    </div>
  )
}

/** Surface a warning when the chosen page or card background is too dark
 *  for the body text colors the site uses (hardcoded `text-stone-*`). We
 *  don't theme text colors site-wide, so dark backgrounds produce poor
 *  contrast that we want the user to know about up front. */
function ContrastWarning({ draft }: { draft: DraftState }) {
  // text-stone-900 is #1c1917 — close to black. If the bg's relative
  // luminance is below ~0.45, contrast against this text starts failing
  // typical readability thresholds.
  const bgLum = relativeLuminance(draft.backgroundColor)
  const cardLum = relativeLuminance(draft.cardBackgroundColor)
  const tooDark = bgLum < 0.45 || cardLum < 0.45
  if (!tooDark) return null
  return (
    <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
      Heads up: the page or box color is dark and the site uses hardcoded
      near-black body text. Recruiters may see low-contrast text on the public
      site. Pick lighter background colors, or use this theme knowingly.
    </p>
  )
}

/** Quick relative luminance approximation per WCAG. Returns 0 (black) to 1
 *  (white). Skips the full sRGB gamma math — good enough for a heuristic. */
function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '')
  if (h.length !== 6) return 1
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** A small live preview of the theme using inline styles so it reflects
 *  changes immediately, without saving + activating the theme. Mirrors the
 *  public site's structure: a body-colored frame with a card inside.
 *
 *  Spacing setting is reflected by scaling the *frame* padding around the
 *  card — that's the visible "rhythm" change a user would see on the real
 *  site when sections breathe more or less. The scale matches what's
 *  actually applied at runtime (SPACING_SCALE in fontPresets.ts). */
function ThemePreview({ draft }: { draft: DraftState }) {
  const scale = SPACING_SCALE[draft.spacing] ?? 1
  // Base padding 24px scaled — produces visible difference between presets:
  // compact 16px, comfortable 24px, spacious 32px (approx).
  const framePadding = Math.round(24 * scale)

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between bg-stone-50 px-4 py-2 border-b border-stone-200">
        <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">
          Preview
        </p>
        <p className="text-[10px] text-stone-500 font-mono">
          spacing × {scale}
        </p>
      </div>
      <div
        style={{
          background: draft.backgroundColor,
          paddingTop: framePadding,
          paddingBottom: framePadding,
          paddingLeft: 16,
          paddingRight: 16,
          fontFamily: `"${draft.bodyFont}", system-ui, sans-serif`,
          transition: 'padding 200ms ease',
        }}
      >
        <div
          className="rounded-lg p-4"
          style={{
            background: draft.cardBackgroundColor,
            border: `1px solid ${draft.cardBorderColor}`,
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider font-medium"
            style={{ color: draft.accentColor }}
          >
            Section eyebrow
          </p>
          <h3
            className="mt-1 text-xl font-semibold tracking-tight text-stone-900"
            style={{
              fontFamily: `"${draft.headingFont}", Georgia, serif`,
            }}
          >
            A section heading
          </h3>
          <p className="mt-2 text-sm text-stone-600">
            The body text shows in this font. Cards use the box colors. Buttons and
            links pick up the accent color.
          </p>
          <span
            className="mt-3 inline-flex items-center rounded-md px-3 py-1 text-xs font-medium text-white"
            style={{ background: draft.accentColor }}
          >
            Accent
          </span>
        </div>
      </div>
    </div>
  )
}
