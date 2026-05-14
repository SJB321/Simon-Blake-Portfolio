import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, FileText, PencilLine } from 'lucide-react'
import { useResumeData } from '../context/ResumeData'
import { generateResumePdf } from '../utils/generatePdf'
import { api } from '../lib/api'

const links = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#experience', label: 'Experience' },
  { href: '#education', label: 'Education' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar() {
  const { data } = useResumeData()
  const navigate = useNavigate()

  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleResume = async () => {
    setOpen(false)
    if (generating) return
    setGenerating(true)
    try {
      await generateResumePdf(data)
    } finally {
      setGenerating(false)
    }
  }

  const handleEditClick = async () => {
    setOpen(false)
    // If no password is set, skip the prompt entirely.
    try {
      const { passwordSet } = await api.authStatus()
      if (!passwordSet) {
        navigate('/edit', { state: { password: '' } })
        return
      }
    } catch (err) {
      console.error('Auth status check failed:', err)
      // If status check fails, fall through to the password prompt anyway
    }
    setShowPasswordModal(true)
  }

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-stone-50/85 backdrop-blur border-b border-stone-200'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="container-page flex items-center justify-between h-16">
          <a
            href="#top"
            className="font-serif text-lg font-semibold tracking-tight text-stone-900 hover:text-accent transition-colors"
          >
            Simon Blake
          </a>

          <ul className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="px-3 py-2 text-sm text-stone-600 hover:text-accent transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="ml-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleResume}
                disabled={generating}
                className="btn-secondary text-xs disabled:opacity-60 disabled:cursor-wait"
                title="Download a PDF resume of this site"
              >
                <FileText size={14} /> {generating ? 'Generating…' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className="btn-secondary text-xs"
                title="Edit the resume content"
              >
                <PencilLine size={14} /> Edit
              </button>
            </li>
          </ul>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-stone-700 hover:text-accent"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {open && (
          <div className="md:hidden border-t border-stone-200 bg-stone-50/95 backdrop-blur">
            <ul className="container-page py-4 space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100 hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={generating}
                  className="btn-secondary w-full disabled:opacity-60 disabled:cursor-wait"
                >
                  <FileText size={14} /> {generating ? 'Generating…' : 'Resume'}
                </button>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="btn-secondary w-full"
                >
                  <PencilLine size={14} /> Edit
                </button>
              </li>
            </ul>
          </div>
        )}
      </header>

      {showPasswordModal && (
        <PasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={(password) => {
            setShowPasswordModal(false)
            navigate('/edit', { state: { password } })
          }}
        />
      )}
    </>
  )
}

/**
 * Inline modal that asks for the admin password and verifies via /api/auth/check.
 * On success it hands the verified password up — the parent stashes it in
 * router state so the edit page can use it for saves without prompting again.
 */
interface PasswordModalProps {
  onClose: () => void
  onSuccess: (password: string) => void
}

function PasswordModal({ onClose, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setChecking(true)
    setError(null)
    try {
      await api.checkPassword(password)
      onSuccess(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-lg"
      >
        <h2 className="font-serif text-xl font-semibold text-stone-900">Enter admin password</h2>
        <p className="mt-1 text-sm text-stone-600">
          The edit page is password-protected.
        </p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-4 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={checking}
            className="btn-primary text-sm disabled:opacity-60 disabled:cursor-wait"
          >
            {checking ? 'Checking…' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}
