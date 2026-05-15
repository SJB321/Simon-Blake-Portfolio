// Section-level AI advice button.
//
// Renders as a small "Advice" button in the bottom-right of a section card.
// On click, sends a flattened representation of the section's current
// contents plus the full resume to /api/ai/advise and renders the response
// as a bulleted list directly below the button.

import { useState } from 'react'
import { Loader2, Sparkles, X } from 'lucide-react'
import { api } from '../../lib/api'
import type { ResumePayload } from '../../types/resume'

interface AiSectionAdviseProps {
  /** Display name of the section ("Projects", "About", etc.). Sent to the
   *  model so it knows what it's reviewing. */
  sectionLabel: string
  /** Thunk that produces a plain-text snapshot of the current section
   *  contents at click time. Called lazily so unsaved edits are included. */
  getSectionContent: () => string
  /** Thunk that returns the live full resume draft. */
  getResume: () => ResumePayload | null
  password: string | undefined
}

export default function AiSectionAdvise({
  sectionLabel,
  getSectionContent,
  getResume,
  password,
}: AiSectionAdviseProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [advice, setAdvice] = useState<string[] | null>(null)

  const requestAdvice = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    setAdvice(null)
    try {
      const { advice: bullets } = await api.aiAdvise(
        {
          sectionLabel,
          sectionContent: getSectionContent(),
          resume: getResume(),
        },
        password,
      )
      if (!bullets.length) {
        setError('AI returned no suggestions — try again.')
      } else {
        setAdvice(bullets)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={requestAdvice}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-wait transition-colors"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Sparkles size={12} />
        )}
        {loading ? 'Thinking…' : 'Get AI advice on this section'}
      </button>

      {error && (
        <p className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </p>
      )}

      {advice && (
        <div className="w-full rounded-md border border-accent/30 bg-accent/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-accent/80">
              <Sparkles size={10} /> AI suggestions for {sectionLabel.toLowerCase()}
            </p>
            <button
              type="button"
              onClick={() => setAdvice(null)}
              title="Dismiss"
              className="rounded p-1 text-stone-400 hover:text-stone-900 hover:bg-stone-100"
            >
              <X size={12} />
            </button>
          </div>
          <ul className="space-y-1.5 text-sm text-stone-800">
            {advice.map((bullet, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="select-none text-accent">•</span>
                <span className="flex-1">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
