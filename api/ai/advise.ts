// POST /api/ai/advise
//
// Generate a bulleted list of improvement suggestions for one section of the
// resume. The client passes:
//   - `sectionLabel`   — name of the section ("Projects", "Experience", etc.)
//   - `sectionContent` — the section's current contents, free-form text.
//   - `resume`         — full resume payload (used as context).
//
// Response: { advice: string[] }.
//
// Same auth as /api/ai/revise — admin password header.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePaidAuth } from '../_lib/auth.js'
import {
  ADVISE_SYSTEM_PROMPT,
  AI_MODEL,
  getOpenAI,
  summarizeResume,
} from '../_lib/openai.js'

interface AdviseBody {
  sectionLabel?: unknown
  sectionContent?: unknown
  resume?: unknown
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!(await requirePaidAuth(req, res))) return

  try {
    const body = (req.body || {}) as AdviseBody
    const sectionLabel =
      typeof body.sectionLabel === 'string' ? body.sectionLabel.trim() : ''
    const sectionContent =
      typeof body.sectionContent === 'string' ? body.sectionContent : ''

    if (!sectionLabel) {
      return res.status(400).json({ error: 'sectionLabel is required' })
    }
    if (sectionContent.length > 8000) {
      return res
        .status(400)
        .json({ error: 'Section is too long to review (max 8000 characters).' })
    }

    const resumeSummary = summarizeResume(
      body.resume && typeof body.resume === 'object'
        ? (body.resume as Parameters<typeof summarizeResume>[0])
        : null,
    )

    const userPrompt = [
      `Section under review: ${sectionLabel}`,
      '',
      'Full resume context (use it to keep suggestions grounded in real background):',
      resumeSummary,
      '',
      `Current contents of "${sectionLabel}":`,
      sectionContent.trim() || '(empty)',
      '',
      'Give 3–5 specific, actionable improvements for this section, following the rules in the system message.',
    ].join('\n')

    const client = getOpenAI()
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        { role: 'system', content: ADVISE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = (completion.choices[0]?.message?.content || '').trim()
    const advice = parseBullets(raw)

    return res.status(200).json({ advice })
  } catch (err) {
    console.error('[/api/ai/advise]', err)
    const message = err instanceof Error ? err.message : 'AI request failed'
    return res.status(500).json({ error: message })
  }
}

/**
 * Parse the model's bulleted response into a clean string[]. Tolerates "- ",
 * "* ", "• ", and numbered bullets in case the model drifts from the spec.
 *
 * If any line starts with a bullet marker, we treat the response as a bulleted
 * list and discard everything else (preamble like "Here are some thoughts:"
 * and closing prose like "Hope this helps!"). If NO line has a marker, we
 * fall back to returning all non-empty lines so the user still sees the
 * model's response rather than an empty UI.
 */
function parseBullets(raw: string): string[] {
  const bulletPattern = /^([-*•]|\d+[.)])\s+/
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const hasBullets = lines.some((line) => bulletPattern.test(line))
  if (!hasBullets) return lines

  return lines
    .filter((line) => bulletPattern.test(line))
    .map((line) => line.replace(bulletPattern, '').trim())
    .filter(Boolean)
}
