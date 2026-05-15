// POST /api/themes/active  { id }  → sets Settings.activeThemeId
//
// Pass `id: null` to clear the active theme and fall back to built-in defaults
// on the public site.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/prisma.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!(await requireAuth(req, res))) return

  try {
    const body = (req.body || {}) as { id?: number | null }
    let nextId: number | null = null
    if (body.id !== null && body.id !== undefined) {
      const id = Number(body.id)
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'id must be a positive integer or null' })
      }
      const exists = await prisma.theme.findUnique({ where: { id } })
      if (!exists) return res.status(404).json({ error: 'Theme not found' })
      nextId = id
    }

    await prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, activeThemeId: nextId },
      update: { activeThemeId: nextId },
    })

    return res.status(200).json({ ok: true, activeThemeId: nextId })
  } catch (err) {
    console.error('[/api/themes/active]', err)
    return res
      .status(500)
      .json({ error: 'Internal server error', detail: (err as Error).message })
  }
}
