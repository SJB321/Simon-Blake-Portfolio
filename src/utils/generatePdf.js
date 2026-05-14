import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { ResumePdf } from '../pdf/ResumePdf.jsx'

let inFlight = false

/**
 * Render the resume as a vector PDF (selectable text, ATS-readable) and
 * stream it to the browser as a download.
 *
 * Pass the resume payload from useResumeData() — keeps DB I/O out of this
 * module and lets us preview generation from the edit page if we ever want.
 */
export async function generateResumePdf(data) {
  if (inFlight) return
  if (!data) {
    alert("Resume data isn't loaded yet. Wait a moment and try again.")
    return
  }
  inFlight = true

  try {
    const blob = await pdf(React.createElement(ResumePdf, { data })).toBlob()
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
    alert(`Sorry — resume download failed: ${err?.message || err}`)
    throw err
  } finally {
    inFlight = false
  }
}
