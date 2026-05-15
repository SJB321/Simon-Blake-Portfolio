// AI-assisted form field wrapper.
//
// Drops a small Sparkles button into the bottom-right corner of an existing
// <Input> or <Textarea>. Clicking it asks /api/ai/revise to rewrite the
// current value with full-resume context, then shows the suggestion in a box
// below the field with Apply / Cancel.
//
// Usage:
//   <AiAssistedField
//     label="Project description"
//     value={project.description}
//     onApply={(text) => patch({ description: text })}
//     password={password}
//     getResume={getResume}
//     multiline
//   >
//     <Textarea ... />
//   </AiAssistedField>
//
// The `getResume` thunk is read at click time (not render time) so the model
// always sees the latest draft, including edits to other fields.

import { useState, type ReactNode } from 'react'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { api } from '../../lib/api'
import type { ResumePayload } from '../../types/resume'

interface AiAssistedFieldProps {
  /** Human-readable field role passed to the model ("Project description",
   *  "Experience bullet"). Helps the model pick the right tone / form. */
  label: string
  /** Current field value — what gets revised. */
  value: string
  /** Called with the AI's text when the user clicks Apply. */
  onApply: (text: string) => void
  password: string | undefined
  /** Thunk returning the live draft. Called at click time, not render time. */
  getResume: () => ResumePayload | null
  /** The input or textarea to wrap. */
  children: ReactNode
  /** Set true when wrapping a <Textarea>. Shifts the button into the bottom-
   *  right corner and adds bottom padding to keep text from running under it. */
  multiline?: boolean
}

export default function AiAssistedField({
  label,
  value,
  onApply,
  password,
  getResume,
  children,
  multiline = false,
}: AiAssistedFieldProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const requestRevision = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    setSuggestion(null)
    try {
      const { suggestion: text } = await api.aiRevise(
        { fieldLabel: label, fieldValue: value ?? '', resume: getResume() },
        password,
      )
      const trimmed = text.trim()
      if (!trimmed) {
        setError('AI had nothing to suggest. Add some text first, then try again.')
      } else {
        setSuggestion(trimmed)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  const applySuggestion = () => {
    if (suggestion === null) return
    onApply(suggestion)
    setSuggestion(null)
  }

  // Right-pad the wrapped field so user-typed text doesn't slide under the
  // sparkle button. Textareas additionally get bottom-padding because their
  // button sits in the corner; single-line inputs only need right-padding.
  const paddingClass = multiline
    ? '[&_textarea]:pr-9 [&_textarea]:pb-8'
    : '[&_input]:pr-9'

  // Button position differs by form factor:
  //   - Textarea → bottom-right corner of the box.
  //   - Input    → vertically centered against the right edge (single-line
  //                fields don't have a meaningful "bottom").
  const buttonPositionClass = multiline
    ? 'bottom-1.5 right-1.5'
    : 'top-1/2 right-1.5 -translate-y-1/2'

  return (
    <div>
      <div className={`relative ${paddingClass}`}>
        {children}
        <button
          type="button"
          onClick={requestRevision}
          disabled={loading}
          title="Improve with AI"
          aria-label="Improve with AI"
          className={`absolute ${buttonPositionClass} rounded-md p-1 text-stone-400 hover:text-accent hover:bg-stone-100 disabled:opacity-50 disabled:cursor-wait transition-colors`}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </p>
      )}

      {suggestion !== null && (
        <div className="mt-2 rounded-md border border-accent/30 bg-accent/5 p-3">
          <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-accent/80">
            <Sparkles size={10} /> AI suggestion
          </p>
          <p className="whitespace-pre-wrap text-sm text-stone-800">{suggestion}</p>
          <div className="mt-3 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <X size={12} /> Cancel
            </button>
            <button
              type="button"
              onClick={applySuggestion}
              className="btn-primary text-xs"
            >
              <Check size={12} /> Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
