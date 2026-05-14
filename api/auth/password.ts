// POST /api/auth/password  { currentPassword, newPassword }  → { ok: true } | 401
//
// Sets or changes the admin password.
//   - currentPassword: must match the existing one (or be empty if no password set)
//   - newPassword:     the new password to store. Pass empty to remove the password
//                       and put the admin back into open mode.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyPassword, setPassword } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = (req.body || {}) as {
      currentPassword?: string
      newPassword?: string
    }
    const currentPassword = body.currentPassword ?? ''
    const newPassword = body.newPassword ?? ''

    // Verify the existing password first
    const allowed = await verifyPassword(currentPassword)
    if (!allowed) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Coerce empty string → null so the column reflects "no password"
    const next: string | null =
      typeof newPassword === 'string' && newPassword.length > 0
        ? newPassword
        : null
    await setPassword(next)

    return res.status(200).json({ ok: true, passwordSet: Boolean(next) })
  } catch (err) {
    console.error('[/api/auth/password]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
