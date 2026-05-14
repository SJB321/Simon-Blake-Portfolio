// Password-based auth helpers for the single-admin edit panel.
//
// Threat model: one user, edits rarely, on a small portfolio site. We don't
// implement sessions or cookies — the frontend holds the password in memory
// for the duration of the edit session and sends it with each write request.
// Server checks against the bcrypt hash stored in Settings.passwordHash.
//
// Edge cases:
//   - Settings row missing → treat as "no password" (open)
//   - passwordHash null/empty → treat as "no password" (open)

import bcrypt from 'bcryptjs'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './prisma.js'

/** Read the current password hash (or null if none set). */
export async function getPasswordHash(): Promise<string | null> {
  const row = await prisma.settings.findUnique({ where: { id: 1 } })
  return row?.passwordHash || null
}

/**
 * Verify a candidate password against the stored hash.
 * Returns true if the candidate matches, OR if no password is set
 * (the admin is open before the first password is configured).
 */
export async function verifyPassword(candidate: unknown): Promise<boolean> {
  const hash = await getPasswordHash()
  if (!hash) return true // open mode
  if (typeof candidate !== 'string') return false
  return bcrypt.compare(candidate, hash)
}

/** Hash and store a new password (or pass null to clear it). */
export async function setPassword(plain: string | null): Promise<void> {
  const passwordHash = plain ? await bcrypt.hash(plain, 10) : null
  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, passwordHash },
    update: { passwordHash },
  })
}

/**
 * Middleware-style helper for write endpoints. If the password doesn't match,
 * writes a 401 and returns false; the caller should then `return` to abort.
 *
 * Usage:
 *   if (!(await requireAuth(req, res))) return
 */
export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<boolean> {
  const header = req.headers['x-admin-password']
  const headerPassword = Array.isArray(header) ? header[0] : header
  const bodyPassword =
    req.body && typeof req.body === 'object' && '__password' in req.body
      ? (req.body as { __password?: unknown }).__password
      : undefined
  const password = headerPassword ?? bodyPassword ?? ''
  const ok = await verifyPassword(password)
  if (!ok) {
    res.status(401).json({ error: 'Invalid or missing admin password.' })
    return false
  }
  return true
}
