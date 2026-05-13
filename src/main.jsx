import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Mirror the html2pdf flow's `body.print-mode` toggle for browser print
// (Ctrl+P / menu print). One stylesheet, two delivery paths.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', () => document.body.classList.add('print-mode'))
  window.addEventListener('afterprint', () => document.body.classList.remove('print-mode'))
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
