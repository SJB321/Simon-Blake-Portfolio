// Tiny fetch wrapper for the resume API. Throws on non-2xx so callers can
// `try { ... } catch (e) { setError(e) }` rather than checking response.ok.

const json = (res) => res.json().catch(() => ({}))

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const body = await json(res)
    // Surface as much of the server's error as we have. `detail` is set on
    // 500s; `issues` is the array of validation messages on 400s.
    const baseMessage = body?.error || `${res.status} ${res.statusText}`
    const extras =
      body?.detail ||
      (Array.isArray(body?.issues) && body.issues.length
        ? body.issues.join('; ')
        : null)
    const message = extras ? `${baseMessage}: ${extras}` : baseMessage
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
