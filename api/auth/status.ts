// GET /api/auth/status → { passwordSet: boolean }
//
// Lets the frontend know whether to prompt for a password before navigating
// to /edit. If passwordSet is false, the admin is open (no password configured)
// and we can skip the prompt entirely.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPasswordHash } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const hash = await getPasswordHash()
    return res.status(200).json({ passwordSet: Boolean(hash) })
  } catch (err) {
    console.error('[/api/auth/status]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
