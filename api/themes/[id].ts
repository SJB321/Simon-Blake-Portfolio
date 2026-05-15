// /api/themes/[id]
//   PUT    → update fields on an existing theme (admin-gated)
//   DELETE → remove a theme; clears Settings.activeThemeId if it was the active one

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/prisma.js'
import { requireAuth } from '../_lib/auth.js'
import { validate, emptyToNull, normalizeSpacing } from '../themes.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const idParam = req.query.id
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid theme id' })
  }

  try {
    if (req.method === 'PUT') return await updateTheme(id, req, res)
    if (req.method === 'DELETE') return await deleteTheme(id, req, res)
    res.setHeader('Allow', 'PUT, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(`[/api/themes/${id}]`, err)
    return res
      .status(500)
      .json({ error: 'Internal server error', detail: (err as Error).message })
  }
}

async function updateTheme(
  id: number,
  req: VercelRequest,
  res: VercelResponse,
) {
  if (!(await requireAuth(req, res))) return

  const body = (req.body || {}) as Record<string, unknown>
  const errors = validate(body)
  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', issues: errors })
  }

  const existing = await prisma.theme.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Theme not found' })

  const theme = await prisma.theme.update({
    where: { id },
    data: {
      // Only patch the fields the client actually sent — `undefined` means
      // "leave alone", which prisma respects.
      name: typeof body.name === 'string' ? body.name : undefined,
      description:
        body.description === undefined ? undefined : emptyToNull(body.description),
      headingFont:
        typeof body.headingFont === 'string' ? body.headingFont : undefined,
      headingFontUrl:
        body.headingFontUrl === undefined
          ? undefined
          : emptyToNull(body.headingFontUrl),
      bodyFont:
        typeof body.bodyFont === 'string' ? body.bodyFont : undefined,
      bodyFontUrl:
        body.bodyFontUrl === undefined ? undefined : emptyToNull(body.bodyFontUrl),
      accentColor:
        typeof body.accentColor === 'string' ? body.accentColor : undefined,
      spacing:
        body.spacing === undefined ? undefined : normalizeSpacing(body.spacing),
    },
  })
  return res.status(200).json({ theme })
}

async function deleteTheme(
  id: number,
  req: VercelRequest,
  res: VercelResponse,
) {
  if (!(await requireAuth(req, res))) return

  // If this theme is currently active, clear the pointer first so the FK
  // doesn't dangle. Then delete.
  await prisma.$transaction(async (tx) => {
    const settings = await tx.settings.findUnique({ where: { id: 1 } })
    if (settings?.activeThemeId === id) {
      await tx.settings.update({
        where: { id: 1 },
        data: { activeThemeId: null },
      })
    }
    await tx.theme.delete({ where: { id } })
  })
  return res.status(200).json({ ok: true })
}
