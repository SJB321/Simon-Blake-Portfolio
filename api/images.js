// /api/images
//   GET   → list every image in the bucket (public — anyone visiting the
//           edit page can see what's available, same as the rendered site).
//           NOTE: we still require auth here because the list itself isn't
//           something we want to expose on the public marketing surface.
//   POST  → upload a new image. Body: { filename, contentType, dataBase64 }.
//   DELETE → remove an image. Body: { filename }.
//
// All write paths require the admin password via the same X-Admin-Password
// header the resume save endpoint uses.

import { requireAuth } from './_lib/auth.js'
import { listImages, uploadImage, deleteImage } from './_lib/storage.js'

// 4 MB after base64 decoding leaves us headroom under Vercel's request limit.
const MAX_BYTES = 4 * 1024 * 1024

export const config = {
  // Raise the JSON body limit so reasonably-sized image uploads fit.
  // Vercel's default is 1 MB which is too small for any photograph.
  api: { bodyParser: { sizeLimit: '6mb' } },
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await getList(req, res)
    if (req.method === 'POST') return await postUpload(req, res)
    if (req.method === 'DELETE') return await deleteOne(req, res)

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[/api/images]', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}

async function getList(req, res) {
  if (!(await requireAuth(req, res))) return
  const images = await listImages()
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ images })
}

async function postUpload(req, res) {
  if (!(await requireAuth(req, res))) return

  const { filename, contentType, dataBase64 } = req.body || {}
  if (!filename || !dataBase64) {
    return res.status(400).json({ error: 'filename and dataBase64 are required' })
  }
  if (!isImageMime(contentType)) {
    return res.status(400).json({
      error: `Unsupported content type "${contentType}". Use jpeg, png, webp, gif, or svg.`,
    })
  }

  let buffer
  try {
    buffer = Buffer.from(dataBase64, 'base64')
  } catch {
    return res.status(400).json({ error: 'dataBase64 is not valid base64' })
  }
  if (buffer.byteLength > MAX_BYTES) {
    return res.status(413).json({
      error: `File too large (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB). Max is 4 MB.`,
    })
  }

  const result = await uploadImage({ filename, contentType, buffer })
  return res.status(201).json(result)
}

async function deleteOne(req, res) {
  if (!(await requireAuth(req, res))) return
  const { filename } = req.body || {}
  if (!filename) return res.status(400).json({ error: 'filename is required' })

  await deleteImage(filename)
  return res.status(200).json({ ok: true })
}

function isImageMime(type) {
  if (!type) return false
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ].includes(type.toLowerCase())
}
