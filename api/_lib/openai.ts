// Shared OpenAI client + prompt engineering for the /api/ai/* endpoints.
//
// The two endpoints (revise, advise) share three things:
//   1. A lazily-initialized client so cold starts that don't touch AI pay
//      nothing for the import.
//   2. A `summarizeResume(...)` helper that flattens the full resume into a
//      compact text block so the model can see the candidate's whole story
//      when revising one field or critiquing one section.
//   3. The system prompts themselves — pulled out here so prompt tweaks
//      happen in one file.
//
// Model: gpt-4o-mini for cost. Each call costs ~$0.0005 at typical resume
// length. Token caps are tight so a runaway response can't drain the
// monthly budget.

import OpenAI from 'openai'

// Lazy singleton — the SDK does some work at construction (UA parsing, etc.)
// and we don't want every /api/resume request to pay that cost.
let client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (client) return client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to .env locally and to Vercel env vars in production.',
    )
  }
  client = new OpenAI({ apiKey })
  return client
}

export const AI_MODEL = 'gpt-4o-mini'

// ---------------------------------------------------------------------------
// Resume summarization — turns the full payload into compact context.
// ---------------------------------------------------------------------------

interface ResumeContextLike {
  profile?: {
    name?: string | null
    role?: string | null
    location?: string | null
    tagline?: string | null
    intro?: string | null
  } | null
  about?: {
    paragraphs?: string[] | null
    interests?: string[] | null
  } | null
  education?: {
    school?: string | null
    college?: string | null
    degree?: string | null
    period?: string | null
    gpa?: string | null
    honors?: string[] | null
    coursework?: string[] | null
  } | null
  skillGroups?: Array<{ title?: string; items?: string[] }>
  projects?: Array<{
    title?: string
    role?: string
    year?: string
    description?: string
    impact?: string[]
    tech?: string[]
  }>
  experience?: Array<{
    role?: string
    company?: string
    location?: string
    period?: string
    points?: string[]
  }>
}

/**
 * Flatten the resume into a compact text block. Used as model context so
 * suggestions stay consistent with the candidate's actual background.
 *
 * Truncates aggressively — we only need the model to know the *shape* of the
 * resume, not every word. Long impact bullets get clipped to 200 chars so a
 * giant project description doesn't blow the context window for the rest.
 */
// Final cap on the serialized summary length. The per-field clips below
// keep individual sections bounded, but a resume with hundreds of projects
// could still blow past sane token counts. After all sections are joined,
// we slice the result so the prompt — and the cost — stays predictable.
const MAX_SUMMARY_CHARS = 8000

export function summarizeResume(resume: ResumeContextLike | null): string {
  if (!resume) return '(no resume context available)'
  const parts: string[] = []

  const p = resume.profile
  if (p) {
    parts.push(
      [
        `Candidate: ${p.name || '(unknown)'}`,
        p.role ? `Target role: ${p.role}` : null,
        p.location ? `Location: ${p.location}` : null,
        p.tagline ? `Tagline: ${p.tagline}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    if (p.intro) parts.push(`Intro:\n${clip(p.intro, 500)}`)
  }

  const a = resume.about
  if (a?.paragraphs?.length) {
    parts.push(`About:\n${a.paragraphs.map((x) => clip(x, 300)).join('\n')}`)
  }
  if (a?.interests?.length) {
    parts.push(`Interests: ${a.interests.join(', ')}`)
  }

  const ed = resume.education
  if (ed) {
    parts.push(
      [
        `Education: ${ed.degree || ''} — ${ed.school || ''}${ed.college ? `, ${ed.college}` : ''}`.trim(),
        ed.period ? `(${ed.period})` : null,
        ed.gpa ? `GPA ${ed.gpa}` : null,
        ed.honors?.length ? `Honors: ${ed.honors.join('; ')}` : null,
        ed.coursework?.length ? `Coursework: ${ed.coursework.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' '),
    )
  }

  if (resume.skillGroups?.length) {
    const skills = resume.skillGroups
      .map((g) => `${g.title}: ${(g.items || []).join(', ')}`)
      .join('\n')
    parts.push(`Skills:\n${skills}`)
  }

  if (resume.projects?.length) {
    const projects = resume.projects
      .map((p) => {
        const head = [p.title, p.role, p.year].filter(Boolean).join(' · ')
        const desc = p.description ? `\n  ${clip(p.description, 300)}` : ''
        const impact = p.impact?.length
          ? `\n  Impact:\n${p.impact.map((b) => `   - ${clip(b, 200)}`).join('\n')}`
          : ''
        const tech = p.tech?.length ? `\n  Tech: ${p.tech.join(', ')}` : ''
        return `- ${head}${desc}${impact}${tech}`
      })
      .join('\n')
    parts.push(`Projects:\n${projects}`)
  }

  if (resume.experience?.length) {
    const exp = resume.experience
      .map((e) => {
        const head = [e.role, e.company, e.location, e.period].filter(Boolean).join(' · ')
        const points = e.points?.length
          ? `\n${e.points.map((b) => `   - ${clip(b, 200)}`).join('\n')}`
          : ''
        return `- ${head}${points}`
      })
      .join('\n')
    parts.push(`Experience:\n${exp}`)
  }

  const joined = parts.join('\n\n')
  return joined.length > MAX_SUMMARY_CHARS
    ? joined.slice(0, MAX_SUMMARY_CHARS - 1).trimEnd() + '\n…(truncated)'
    : joined
}

function clip(s: string, max: number): string {
  if (!s) return ''
  const trimmed = s.trim()
  return trimmed.length > max ? trimmed.slice(0, max - 1).trimEnd() + '…' : trimmed
}

// ---------------------------------------------------------------------------
// System prompts.
// ---------------------------------------------------------------------------

/** Single-field rewrite. Returns prose only — no preamble, no quotes. */
export const REVISE_SYSTEM_PROMPT = `You are an expert resume and portfolio editor for a Game Design & Development student at RIT applying to gameplay programming and engine roles.

Your job is to rewrite a single field of the candidate's resume so it is:
- Concise and high-impact — every word earns its place.
- Professional and confident, never boastful or buzzword-laden.
- Active voice with strong action verbs (architected, shipped, optimized, designed, profiled).
- Specific where the original is specific; never fabricate numbers, tools, dates, titles, or outcomes that are not present in the original or in the resume context.
- Roughly the same length as the original (within ±30%) unless the original is clearly too long or padded.
- Plain prose unless the original is a bullet — preserve the field's form factor.

You will be given full resume context. Use it to make the rewrite consistent with the candidate's real background, but do not invent facts.

Output ONLY the revised text. No preamble ("Here is..."), no quote marks, no explanations, no bullets unless the original was a bullet, no markdown formatting. If the input is empty or nonsensical, return an empty string.`

/** Section-level critique. Returns a bulleted list. */
export const ADVISE_SYSTEM_PROMPT = `You are a senior technical recruiter and portfolio reviewer for game industry roles, giving feedback to a Game Design & Development student at RIT.

You will be shown one section of their resume along with the rest of the resume for context. Your job is to give 3–5 specific, actionable improvements for THAT section.

Each bullet must:
- Identify a concrete weakness or opportunity in the section as written.
- Suggest a specific fix — not generic advice. "Quantify your impact" is too vague; "On the Combat System project, replace 'made it faster' with the actual frame-time delta" is good.
- Stay grounded in what the candidate has actually built; do not invent achievements or recommend skills the candidate does not have.
- Be one or two sentences. Direct, no hedging.

Tone: respectful peer, not a drill sergeant. Honest but encouraging.

Output ONLY a bulleted list using "- " as the bullet marker, one bullet per line. No preamble, no closing summary, no markdown headers. If the section is empty or there is nothing to improve, return a single bullet acknowledging that.`
