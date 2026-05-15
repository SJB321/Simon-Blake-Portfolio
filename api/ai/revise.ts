// POST /api/ai/revise
//
// Rewrite a single resume field with OpenAI. The client passes:
//   - `fieldLabel`   — human-readable identifier ("Project description", "Experience bullet", etc.)
//                       so the model knows what the field is *for*.
//   - `fieldValue`   — the current text to rewrite.
//   - `resume`       — the full current resume payload (used as context only).
//
// Response: { suggestion: string }.
//
// Auth: same X-Admin-Password header that gates every other write endpoint.
// This isn't strictly a *write* but the key has real money on it, so the
// same gate protects against drive-by abuse.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requirePaidAuth } from '../_lib/auth.js'
import {
  AI_MODEL,
  REVISE_SYSTEM_PROMPT,
  getOpenAI,
  summarizeResume,
} from '../_lib/openai.js'

interface ReviseBody {
  fieldLabel?: unknown
  fieldValue?: unknown
  resume?: unknown
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!(await requirePaidAuth(req, res))) return

  try {
    const body = (req.body || {}) as ReviseBody
    const fieldLabel = typeof body.fieldLabel === 'string' ? body.fieldLabel.trim() : ''
    const fieldValue = typeof body.fieldValue === 'string' ? body.fieldValue : ''

    if (!fieldLabel) {
      return res.status(400).json({ error: 'fieldLabel is required' })
    }
    if (!fieldValue.trim()) {
      // Nothing to revise — return an empty suggestion rather than burning a
      // round-trip to OpenAI for "".
      return res.status(200).json({ suggestion: '' })
    }
    if (fieldValue.length > 4000) {
      return res
        .status(400)
        .json({ error: 'Field is too long to revise (max 4000 characters).' })
    }

    const resumeSummary = summarizeResume(
      body.resume && typeof body.resume === 'object'
        ? (body.resume as Parameters<typeof summarizeResume>[0])
        : null,
    )

    const userPrompt = [
      `Field to revise: ${fieldLabel}`,
      '',
      'Full resume context (do not invent facts beyond this):',
      resumeSummary,
      '',
      'Current text:',
      fieldValue.trim(),
      '',
      'Rewrite the current text following the rules in the system message. Output ONLY the revision.',
    ].join('\n')

    const client = getOpenAI()
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        { role: 'system', content: REVISE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const suggestion = (completion.choices[0]?.message?.content || '').trim()
    // Belt-and-braces: strip surrounding quotes if the model wrapped its output.
    const cleaned = suggestion
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^Here(?:'s| is)[^\n:]*:\s*/i, '')
      .trim()

    return res.status(200).json({ suggestion: cleaned })
  } catch (err) {
    console.error('[/api/ai/revise]', err)
    const message = err instanceof Error ? err.message : 'AI request failed'
    return res.status(500).json({ error: message })
  }
}
