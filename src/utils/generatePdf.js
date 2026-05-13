import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { ResumePdf } from '../pdf/ResumePdf.jsx'

let inFlight = false

/**
 * Render the resume as a vector PDF (selectable text, ATS-readable) and
 * stream it to the browser as a download.
 *
 * Uses @react-pdf/renderer to build the PDF from a declarative React tree
 * — independent of the live DOM, so styling decisions live in
 * src/pdf/ResumePdf.jsx, not in print-CSS.
 */
export async function generateResumePdf() {
  if (inFlight) return
  inFlight = true

  try {
    const blob = await pdf(React.createElement(ResumePdf)).toBlob()
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
