// Theme library — appears at the very top of the edit page.
//
// Lets the admin create / edit / delete / activate visual themes that style
// the public site (and the downloadable PDF where supported). Stays visually
// in the same neutral edit-page palette regardless of which theme is active.

import { useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useResumeData } from '../../context/ResumeData'
import { HEADING_PRESETS, BODY_PRESETS } from '../../lib/fontPresets'
import ThemeEditor from './ThemeEditor'
import type { Theme } from '../../types/resume'

interface ThemeManagerProps {
  password: string | undefined
}

export default function ThemeManager({ password }: ThemeManagerProps) {
  const { data, refetch, setData } = useResumeData()
  const themes = data?.themes ?? []
  const activeId = data?.activeThemeId ?? null

  const [editing, setEditing] = useState<Theme | null>(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => refetch({ fresh: true })

  /**
   * Activate a theme optimistically: update local context immediately so the
   * "Active" badge moves without waiting for the server. If the request fails
   * we roll back via a fresh refetch. Removes ~300-800ms of perceived delay
   * per activation click.
   */
  const handleActivate = async (id: number) => {
    if (busy || !data) return
    setBusy(true)
    setError(null)

    // Snapshot for rollback
    const previous = data
    const nextTheme = data.themes.find((t) => t.id === id) ?? null
    setData({ ...data, activeThemeId: id, activeTheme: nextTheme })

    try {
      await api.setActiveTheme(id, password)
    } catch (err) {
      // Roll back optimistic update on failure
      setData(previous)
      setError(err instanceof Error ? err.message : 'Activation failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (theme: Theme) => {
    if (busy) return
    const msg = `Delete theme "${theme.name}"? This can't be undone.`
    if (!confirm(msg)) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteTheme(theme.id, password)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          {themes.length === 0
            ? 'No themes yet. Add one to customize the public site.'
            : `${themes.length} theme${themes.length === 1 ? '' : 's'} · active drives the live site & PDF.`}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn-primary text-sm"
        >
          <Plus size={14} /> New theme
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeId}
            disabled={busy}
            onActivate={() => handleActivate(theme.id)}
            onEdit={() => setEditing(theme)}
            onDelete={() => handleDelete(theme)}
          />
        ))}
      </ul>

      {creating && (
        <ThemeEditor
          mode="create"
          password={password}
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false)
            await refresh()
          }}
        />
      )}

      {editing && (
        <ThemeEditor
          mode="edit"
          theme={editing}
          password={password}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await refresh()
          }}
        />
      )}
    </div>
  )
}

interface ThemeCardProps {
  theme: Theme
  isActive: boolean
  disabled: boolean
  onActivate: () => void
  onEdit: () => void
  onDelete: () => void
}

function ThemeCard({
  theme,
  isActive,
  disabled,
  onActivate,
  onEdit,
  onDelete,
}: ThemeCardProps) {
  const headingPreset = HEADING_PRESETS.find((p) => p.name === theme.headingFont)
  const bodyPreset = BODY_PRESETS.find((p) => p.name === theme.bodyFont)
  return (
    <li
      className={`relative rounded-lg border bg-white p-4 transition-colors ${
        isActive ? 'border-accent ring-1 ring-accent/30' : 'border-stone-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-semibold text-stone-900 truncate">
              {theme.name}
            </h3>
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                <Check size={10} /> Active
              </span>
            )}
          </div>
          {theme.description && (
            <p className="mt-1 text-xs text-stone-500 line-clamp-2">
              {theme.description}
            </p>
          )}
        </div>
        {/* Color swatches — surface colors on top row, text colors below */}
        <div className="flex flex-col shrink-0 gap-1" aria-hidden>
          <div className="flex gap-0.5">
            <ColorSwatch color={theme.accentColor} title={`Accent ${theme.accentColor}`} />
            <ColorSwatch color={theme.backgroundColor} title={`Page ${theme.backgroundColor}`} />
            <ColorSwatch color={theme.cardBackgroundColor} title={`Box ${theme.cardBackgroundColor}`} />
            <ColorSwatch color={theme.cardBorderColor} title={`Border ${theme.cardBorderColor}`} />
          </div>
          <div className="flex gap-0.5">
            <ColorSwatch color={theme.textColor} title={`Heading text ${theme.textColor}`} />
            <ColorSwatch color={theme.bodyTextColor} title={`Body text ${theme.bodyTextColor}`} />
            <ColorSwatch color={theme.mutedTextColor} title={`Muted text ${theme.mutedTextColor}`} />
          </div>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-stone-500">
        <div>
          <dt className="uppercase tracking-wider font-medium">Heading</dt>
          <dd className="mt-0.5 text-stone-800 truncate">
            {theme.headingFont}
            {!headingPreset && <span className="text-stone-400"> · custom</span>}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider font-medium">Body</dt>
          <dd className="mt-0.5 text-stone-800 truncate">
            {theme.bodyFont}
            {!bodyPreset && <span className="text-stone-400"> · custom</span>}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider font-medium">Spacing</dt>
          <dd className="mt-0.5 text-stone-800 capitalize">{theme.spacing}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-end gap-1">
        {/* (Action buttons below) */}
        {!isActive && (
          <button
            type="button"
            onClick={onActivate}
            disabled={disabled}
            className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
          >
            Set active
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="rounded p-1.5 text-stone-400 hover:text-accent hover:bg-stone-100 disabled:opacity-50"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="rounded p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  )
}

function ColorSwatch({ color, title }: { color: string; title: string }) {
  return (
    <div
      title={title}
      className="h-5 w-5 rounded-full border border-stone-300"
      style={{ background: color }}
    />
  )
}
