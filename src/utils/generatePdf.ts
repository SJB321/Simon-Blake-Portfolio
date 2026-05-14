import React from 'react'
// `pdf()` is typed to accept a <Document> element specifically. ResumePdf
// returns a <Document> at runtime but TS doesn't know that — `any` is the
// pragmatic escape hatch.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { pdf } from '@react-pdf/renderer'
import { ResumePdf } from '../pdf/ResumePdf'
import type { ResumePayload } from '../types/resume'

let inFlight = false

/**
 * Render the resume as a vector PDF (selectable text, ATS-readable) and
 * stream it to the browser as a download.
 *
 * Pass the resume payload from useResumeData() — keeps DB I/O out of this
 * module and lets us preview generation from the edit page if we ever want.
 */
export async function generateResumePdf(data: ResumePayload | null | undefined): Promise<void> {
  if (inFlight) return
  if (!data) {
    alert("Resume data isn't loaded yet. Wait a moment and try again.")
    return
  }
  inFlight = true

  try {
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
