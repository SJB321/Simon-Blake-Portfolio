// /api/themes
//   GET  → list every theme + the id of the currently active one
//   POST → create a new theme (admin-gated)
//
// Per-theme update/delete lives at /api/themes/[id].ts
// Setting the active theme lives at /api/themes/active.ts

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './_lib/prisma.js'
import { requireAuth } from './_lib/auth.js'

interface ThemeBody {
  name?: string
  description?: string | null
  headingFont?: string
  headingFontUrl?: string | null
  bodyFont?: string
  bodyFontUrl?: string | null
  accentColor?: string
  spacing?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') return await getThemes(res)
    if (req.method === 'POST') return await createTheme(req, res)

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[/api/themes]', err)
    return res
      .status(500)
      .json({ error: 'Internal server error', detail: (err as Error).message })
  }
}

async function getThemes(res: VercelResponse) {
  const [themes, settings] = await Promise.all([
    prisma.theme.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ])
  res.setHeader('Cache-Control', 'no-store, must-revalidate')
  return res.status(200).json({
    themes,
    activeThemeId: settings?.activeThemeId ?? null,
  })
}

async function createTheme(req: VercelRequest, res: VercelResponse) {
  if (!(await requireAuth(req, res))) return

  const body = (req.body || {}) as ThemeBody
  const errors = validate(body, { requireName: true })
  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', issues: errors })
  }

  const theme = await prisma.theme.create({
    data: {
      name: body.name as string,
      description: emptyToNull(body.description),
      headingFont: body.headingFont || 'Source Serif 4',
      headingFontUrl: emptyToNull(body.headingFontUrl),
      bodyFont: body.bodyFont || 'Source Sans 3',
      bodyFontUrl: emptyToNull(body.bodyFontUrl),
      accentColor: body.accentColor || '#1e3a5f',
      spacing: normalizeSpacing(body.spacing),
    },
  })
  return res.status(201).json({ theme })
}

export function validate(
  body: ThemeBody,
  opts: { requireName?: boolean } = {},
): string[] {
  const errors: string[] = []
  const trimmed = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

  if (opts.requireName && !trimmed(body.name)) errors.push('name is required')

  if (body.accentColor !== undefined && body.accentColor !== null) {
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(body.accentColor)) {
      errors.push('accentColor must be a hex like #1e3a5f')
    }
  }

  if (body.spacing !== undefined && body.spacing !== null) {
    if (!['compact', 'comfortable', 'spacious'].includes(String(body.spacing))) {
      errors.push("spacing must be 'compact', 'comfortable', or 'spacious'")
    }
  }

  return errors
}

export function emptyToNull(v: unknown): string | null {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

export function normalizeSpacing(v: unknown): string {
  const s = String(v ?? '').toLowerCase()
  return ['compact', 'comfortable', 'spacious'].includes(s) ? s : 'comfortable'
}
