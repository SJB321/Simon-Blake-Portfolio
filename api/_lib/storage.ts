// Supabase Storage client (server-side only — uses the service-role key).
//
// The service-role key has admin access to your project's storage and database.
// It MUST stay on the server. Never import this file from anything under src/.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ImageItem } from '../../src/types/resume.js'

const BUCKET = process.env.SUPABASE_BUCKET || 'resume-images'

let cachedClient: SupabaseClient | null = null

/** Lazy-initialize a single Supabase client per warm function instance. */
function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env var. Set both in .env and in Vercel.',
    )
  }
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

/** Lists every object in the bucket, newest first, with a public URL each. */
export async function listImages(): Promise<ImageItem[]> {
  const supabase = getClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })

  if (error) throw new Error(`List failed: ${error.message}`)

  return (data || [])
    // Supabase returns a placeholder entry for empty folders; filter it
    .filter((obj) => obj.name && obj.name !== '.emptyFolderPlaceholder')
    .map((obj) => ({
      name: obj.name,
      size: (obj.metadata?.size as number | undefined) ?? null,
      contentType: (obj.metadata?.mimetype as string | undefined) ?? null,
      createdAt: obj.created_at,
      url: publicUrl(obj.name),
    }))
}

interface UploadArgs {
  filename: string
  contentType: string | null | undefined
  buffer: Buffer
}

/**
 * Upload a buffer to the bucket and return the public URL.
 * `filename` is the desired stored name (without leading slash). If a file with
 * the same name already exists it is overwritten — caller is responsible for
 * dedup naming.
 */
export async function uploadImage({
  filename,
  contentType,
  buffer,
}: UploadArgs): Promise<{ name: string; url: string }> {
  const supabase = getClient()
  const safeName = sanitizeFilename(filename)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(safeName, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
      cacheControl: '3600',
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  return { name: safeName, url: publicUrl(safeName) }
}

/** Permanently delete a file. */
export async function deleteImage(filename: string): Promise<{ ok: true }> {
  const supabase = getClient()
  const { error } = await supabase.storage.from(BUCKET).remove([filename])
  if (error) throw new Error(`Delete failed: ${error.message}`)
  return { ok: true }
}

/** Public URL builder (bucket must be public for these to resolve). */
function publicUrl(filename: string): string {
  const supabase = getClient()
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

/**
 * Make a filename safe for URLs and de-collide with timestamp prefix so
 * uploading two "photo.jpg" files doesn't overwrite the first.
 */
function sanitizeFilename(name: string): string {
  const cleaned = (name || 'upload')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  const ts = Date.now().toString(36)
  return `${ts}-${cleaned}`
}
