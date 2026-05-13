import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#experience', label: 'Experience' },
  { href: '#education', label: 'Education' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const handleResume = () => {
    setOpen(false)
    window.print()
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
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
          <li className="ml-2">
            <button
              type="button"
              onClick={handleResume}
              className="btn-secondary text-xs"
              title="Save the site as a PDF"
            >
              Resume
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
            <li className="pt-2">
              <button
                type="button"
                onClick={handleResume}
                className="btn-secondary w-full"
              >
                Resume
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
