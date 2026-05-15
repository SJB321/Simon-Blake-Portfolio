// Tiny fetch wrapper for the resume API. Throws on non-2xx so callers can
// `try { ... } catch (e) { setError(e) }` rather than checking response.ok.

import type { ResumePayload, ImageItem, Theme } from '../types/resume'

export interface ThemeInput {
  name: string
  description?: string | null
  headingFont: string
  headingFontUrl?: string | null
  bodyFont: string
  bodyFontUrl?: string | null
  accentColor: string
  backgroundColor: string
  cardBackgroundColor: string
  cardBorderColor: string
  spacing: string
}

interface ErrorBody {
  error?: string
  detail?: string
  issues?: string[]
}

/** Augmented Error carrying server response metadata. */
export class ApiError extends Error {
  status: number
  detail: ErrorBody
  constructor(message: string, status: number, detail: ErrorBody) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

const json = async (res: Response): Promise<unknown> => {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

async function request<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const body = (await json(res)) as ErrorBody
    // Surface as much of the server's error as we have. `detail` is set on
    // 500s; `issues` is the array of validation messages on 400s.
    const baseMessage = body?.error || `${res.status} ${res.statusText}`
    const extras =
      body?.detail ||
      (Array.isArray(body?.issues) && body.issues.length
        ? body.issues.join('; ')
        : null)
    const message = extras ? `${baseMessage}: ${extras}` : baseMessage
    throw new ApiError(message, res.status, body)
  }
  return (await json(res)) as T
}

interface AuthStatus {
  passwordSet: boolean
}
interface OkResponse {
  ok: true
}
interface UploadResult {
  name: string
  url: string
}

export const api = {
  /**
   * Load the full resume payload — singletons + lists.
   * `fresh: true` adds a cache-busting query string so an edge/CDN/browser
   * cache won't return stale data after a save.
   */
  getResume: ({ fresh = false }: { fresh?: boolean } = {}): Promise<ResumePayload> => {
    const url = fresh ? `/api/resume?t=${Date.now()}` : '/api/resume'
    const headers: HeadersInit = fresh ? { 'Cache-Control': 'no-cache' } : {}
    return request<ResumePayload>(url, { headers })
  },

  /**
   * Save the full resume. Admin password is sent as a header (held in memory
   * by the editing UI; never persisted to localStorage).
   */
  putResume: (payload: ResumePayload, password: string | undefined): Promise<OkResponse> =>
    request<OkResponse>('/api/resume', {
      method: 'PUT',
      headers: { 'X-Admin-Password': password ?? '' },
      body: JSON.stringify(payload),
    }),

  authStatus: (): Promise<AuthStatus> => request<AuthStatus>('/api/auth/status'),

  checkPassword: (password: string): Promise<OkResponse> =>
    request<OkResponse>('/api/auth/check', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  changePassword: (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: true; passwordSet: boolean }> =>
    request('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // ── Image library ──────────────────────────────────────────
  /** Read the full list (admin password required to discourage scraping). */
  listImages: (password: string | undefined): Promise<{ images: ImageItem[] }> =>
    request('/api/images', {
      headers: { 'X-Admin-Password': password ?? '' },
    }),

  /**
   * Upload a File (from a <input type="file">) by reading it as base64 first.
   * Server decodes and pushes to Supabase Storage with a hashed unique name.
   */
  uploadImage: async (file: File, password: string | undefined): Promise<UploadResult> => {
    const dataBase64 = await fileToBase64(file)
    return request('/api/images', {
      method: 'POST',
      headers: { 'X-Admin-Password': password ?? '' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        dataBase64,
      }),
    })
  },

  deleteImage: (filename: string, password: string | undefined): Promise<OkResponse> =>
    request('/api/images', {
      method: 'DELETE',
      headers: { 'X-Admin-Password': password ?? '' },
      body: JSON.stringify({ filename }),
    }),

  // ── Themes ────────────────────────────────────────────────
  listThemes: (): Promise<{ themes: Theme[]; activeThemeId: number | null }> =>
    request('/api/themes'),

  createTheme: (
    body: ThemeInput,
    password: string | undefined,
  ): Promise<{ theme: Theme }> =>
    request('/api/themes', {
      method: 'POST',
      headers: { 'X-Admin-Password': password ?? '' },
      body: JSON.stringify(body),
    }),

  updateTheme: (
    id: number,
    body: Partial<ThemeInput>,
    password: string | undefined,
  ): Promise<{ theme: Theme }> =>
    request(`/api/themes/${id}`, {
      method: 'PUT',
      headers: { 'X-Admin-Password': password ?? '' },
      body: JSON.stringify(body),
    }),

  deleteTheme: (id: number, password: string | undefined): Promise<OkResponse> =>
    request(`/api/themes/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': password ?? '' },
    }),

  setActiveTheme: (
    id: number | null,
    password: string | undefined,
  ): Promise<{ ok: true; activeThemeId: number | null }> =>
    request('/api/themes/active', {
      method: 'POST',
      headers: { 'X-Admin-Password': password ?? '' },
      body: JSON.stringify({ id }),
    }),
}

/** Read a File into a base64 string (no `data:` prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string // "data:image/png;base64,iVBORw0KGgo..."
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error || new Error('Read failed'))
    reader.readAsDataURL(file)
  })
}
