// Image library — appears at the top of the edit page.
//
// Responsibilities:
//   - List every image currently in the Supabase bucket
//   - Upload new ones via a file input (drag-and-drop is bonus)
//   - Copy a URL or delete an image
//
// Style mirrors the other edit-page sections: white card, font-serif heading,
// subtle borders, accent-color action buttons. No "admin dashboard" visual noise.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Trash2, Upload, Image as ImageIcon, X } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useResumeData } from '../../context/ResumeData.jsx'

/**
 * Walk the resume data and report every section currently pointing at the
 * given image URL. Used to warn the admin before deletion.
 */
function findReferences(data, url) {
  if (!data || !url) return []
  const refs = []
  if (data.profile?.imageUrl === url) refs.push('Hero / Profile photo')
  if (data.education?.imageUrl === url) refs.push('Education card')
  for (const p of data.projects || []) {
    if (p.imageUrl === url) refs.push(`Project: ${p.title || '(untitled)'}`)
  }
  for (const e of data.experience || []) {
    if (e.imageUrl === url) {
      refs.push(`Experience: ${e.role || ''} @ ${e.company || ''}`.trim())
    }
  }
  return refs
}

export default function ImageManager({ password }) {
  const { data: resumeData } = useResumeData()
  const [images, setImages] = useState(null)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [copiedName, setCopiedName] = useState(null)
  const fileInputRef = useRef(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const { images } = await api.listImages(password)
      setImages(images)
    } catch (err) {
      setError(err.message || 'Could not load images')
    }
  }, [password])

  useEffect(() => {
    load()
  }, [load])

  const handleFiles = async (files) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      // Upload sequentially so a single failure stops the rest.
      for (const file of files) {
        await api.uploadImage(file, password)
      }
      await load()
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (filename) => {
    const img = images?.find((i) => i.name === filename)
    const refs = img ? findReferences(resumeData, img.url) : []

    let message = `Delete "${filename}"? This cannot be undone.`
    if (refs.length) {
      message +=
        '\n\nThis image is currently used by:\n' +
        refs.map((r) => `  • ${r}`).join('\n') +
        '\n\nThose sections will show a broken image until you pick a different one. Continue?'
    }
    if (!confirm(message)) return

    try {
      await api.deleteImage(filename, password)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const handleCopyUrl = async (url, name) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedName(name)
      setTimeout(() => setCopiedName(null), 1500)
    } catch {
      // Older browsers: noop
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload row */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50/60 px-4 py-3">
        <ImageIcon size={18} className="text-stone-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-800">Upload an image</p>
          <p className="text-xs text-stone-500">
            JPG, PNG, WEBP, GIF, or SVG. Max 4 MB.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-primary text-sm disabled:opacity-60 disabled:cursor-wait"
        >
          <Upload size={14} /> {uploading ? 'Uploading…' : 'Choose file…'}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {/* Gallery */}
      {images === null ? (
        <p className="text-sm text-stone-500">Loading library…</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-stone-500">
          No images yet. Upload your first one above.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <li
              key={img.name}
              className="group relative overflow-hidden rounded-lg border border-stone-200 bg-white"
            >
              <div className="aspect-[4/3] bg-stone-100">
                <img
                  src={img.url}
                  alt={img.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-stone-100 px-2.5 py-1.5">
                <p
                  className="text-[11px] text-stone-600 truncate"
                  title={img.name}
                >
                  {img.name}
                </p>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(img.url, img.name)}
                    className="rounded p-1 text-stone-400 hover:text-accent hover:bg-stone-100"
                    title="Copy URL"
                  >
                    {copiedName === img.name ? (
                      <span className="text-[10px] font-medium text-emerald-600 px-0.5">
                        Copied
                      </span>
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(img.name)}
                    className="rounded p-1 text-stone-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Inline image-picker used in section forms. Shows the current selection (or
 * a placeholder) and opens a modal gallery to choose a different one.
 *
 * `value` is a URL string (or empty/null). `onChange` is called with the new
 * URL or with '' to clear.
 */
export function ImagePicker({ value, onChange, password, label = 'Image' }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img
          src={value}
          alt=""
          className="h-14 w-14 rounded-md border border-stone-200 object-cover bg-stone-100"
        />
      ) : (
        <div className="h-14 w-14 rounded-md border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400">
          <ImageIcon size={18} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-stone-700">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-medium text-accent hover:underline"
          >
            {value ? 'Change…' : 'Choose…'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-stone-500 hover:text-red-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {open && (
        <ImagePickerModal
          password={password}
          onClose={() => setOpen(false)}
          onPick={(url) => {
            onChange(url)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

function ImagePickerModal({ password, onPick, onClose }) {
  const [images, setImages] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .listImages(password)
      .then(({ images }) => {
        if (!cancelled) setImages(images)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load images')
      })
    return () => {
      cancelled = true
    }
  }, [password])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-xl border border-stone-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <h3 className="font-serif text-lg font-semibold text-stone-900">
            Choose an image
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-auto p-5">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && images === null && (
            <p className="text-sm text-stone-500">Loading…</p>
          )}
          {images?.length === 0 && (
            <p className="text-sm text-stone-500">
              Upload images in the library at the top of the edit page first.
            </p>
          )}
          {images?.length > 0 && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <li key={img.name}>
                  <button
                    type="button"
                    onClick={() => onPick(img.url)}
                    className="w-full overflow-hidden rounded-lg border border-stone-200 bg-white hover:border-accent hover:shadow-sm transition-all"
                  >
                    <div className="aspect-[4/3] bg-stone-100">
                      <img
                        src={img.url}
                        alt={img.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p
                      className="px-2 py-1.5 text-[11px] text-stone-600 truncate text-left"
                      title={img.name}
                    >
                      {img.name}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
