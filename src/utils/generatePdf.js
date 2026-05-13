import html2pdf from 'html2pdf.js'

let inFlight = false

/**
 * Render the page as a PDF resume and stream it to the browser as a download.
 *
 * Adds `body.print-mode` so the resume-styled CSS applies during capture,
 * waits for web fonts, lets the browser paint one frame, then calls html2pdf
 * (html2canvas + jsPDF). Always removes the class on completion or error.
 */
export async function generateResumePdf() {
  if (inFlight) return
  inFlight = true

  const body = document.body
  body.classList.add('print-mode')

  // Wait for web fonts to render with their final glyphs, then for the
  // browser to paint the print-mode layout before we snapshot it.
  try {
    if (document.fonts?.ready) await document.fonts.ready
  } catch {
    /* document.fonts not supported — skip */
  }
  await new Promise((resolve) => requestAnimationFrame(resolve))

  try {
    await html2pdf()
      .set({
        margin: [0.4, 0.45, 0.4, 0.45],
        filename: 'Simon-Blake-Resume.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0,
          windowWidth: 1024,
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(body)
      .save()
  } finally {
    body.classList.remove('print-mode')
    inFlight = false
  }
}
