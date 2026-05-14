// Tiny fetch wrapper for the resume API. Throws on non-2xx so callers can
// `try { ... } catch (e) { setError(e) }` rather than checking response.ok.

const json = (res) => res.json().catch(() => ({}))

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const body = await json(res)
    // Include the server's `detail` field (which we set on 500s) so the UI
    // can show the actual error message instead of a generic "Internal server
    // error". Without this we'd have to read Vercel logs to debug.
    const baseMessage = body?.error || `${res.status} ${res.statusText}`
    const message = body?.detail ? `${baseMessage}: ${body.detail}` : baseMessage
    const err = new Error(message)
    err.status = res.status
    err.detail = body
    throw err
  }
  return json(res)
}

export const api = {
  /** Load the full resume payload — singletons + lists. */
  getResume: () => request('/api/resume'),

  /**
   * Save the full resume. Admin password is sent as a header (held in memory
   * by the editing UI; never persisted to localStorage).
   */
  putResume: (payload, password) =>
    request('/api/resume', {
      method: 'PUT',
      headers: { 'X-Admin-Password': password ?? '' },
      body: JSON.stringify(payload),
    }),

  authStatus: () => request('/api/auth/status'),

  checkPassword: (password) =>
    request('/api/auth/check', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
}
