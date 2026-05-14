import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Mirror the print-mode toggle for browser print (Ctrl+P / menu print).
// One stylesheet, two delivery paths.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', () => document.body.classList.add('print-mode'))
  window.addEventListener('afterprint', () => document.body.classList.remove('print-mode'))
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
