// POST /api/auth/check  { password }  → { ok: true } | 401
//
// Used by the password modal to gate access to /edit. The frontend keeps the
// password in memory after a 200 and reuses it as the X-Admin-Password header
// on save requests. No session is created server-side.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyPassword } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = (req.body || {}) as { password?: string }
    const ok = await verifyPassword(body.password ?? '')
    if (!ok) return res.status(401).json({ error: 'Incorrect password' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[/api/auth/check]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
