// POST /api/auth/check  { password }  → { ok: true } | 401
//
// Used by the password modal to gate access to /edit. The frontend keeps the
// password in memory after a 200 and reuses it as the X-Admin-Password header
// on save requests. No session is created server-side.

import { verifyPassword } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { password = '' } = req.body || {}
    const ok = await verifyPassword(password)
    if (!ok) return res.status(401).json({ error: 'Incorrect password' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[/api/auth/check]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
