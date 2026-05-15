import React from 'react'
import type { ResumePayload } from '../types/resume'

let inFlight = false
let prefetched = false

/**
 * Warm up the PDF chunk so it's already cached by the time the user clicks
 * "Resume". Called on Resume-button hover/focus from the navbar and hero —
 * cuts ~500-1500 ms of perceived latency on click.
 *
 * Idempotent: runs the imports exactly once per session and resolves
 * immediately on subsequent calls. The Promise itself doesn't matter — we
 * just need the module-cache side-effect.
 */
export function prefetchResumePdf(): void {
  if (prefetched) return
  prefetched = true
  // Fire-and-forget — errors are non-fatal since the user might never click.
  Promise.all([
    import('@react-pdf/renderer'),
    import('../pdf/ResumePdf'),
  ]).catch(() => {
    // If prefetch fails (offline, network glitch), reset the flag so the
    // real click handler can try again.
    prefetched = false
  })
}

/**
 * Render the resume as a vector PDF (selectable text, ATS-readable) and
 * stream it to the browser as a download.
 *
 * Performance: `@react-pdf/renderer` is ~400 KB gzipped and ResumePdf pulls
 * in two woff files. We deliberately use dynamic `import()` so that machinery
 * is split into its own chunk and only fetched the first time someone clicks
 * "Resume" — the public-site initial load no longer pays for it.
 */
export async function generateResumePdf(
  data: ResumePayload | null | undefined,
): Promise<void> {
  if (inFlight) return
  if (!data) {
    alert("Resume data isn't loaded yet. Wait a moment and try again.")
    return
  }
  inFlight = true

  try {
    // Load both modules in parallel on first invocation. Subsequent calls
    // hit Vite's module cache so the import resolves instantly.
    const [{ pdf }, { ResumePdf }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../pdf/ResumePdf'),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(ResumePdf, { data }) as any
    const blob = await pdf(element).toBlob()
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'Simon-Blake-Resume.pdf'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Free the blob URL on the next tick so the download has time to start.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err) {
    console.error('[Resume PDF] generation failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    alert(`Sorry — resume download failed: ${message}`)
    throw err
  } finally {
    inFlight = false
  }
}
