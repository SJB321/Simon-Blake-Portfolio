import { Github, Linkedin, Mail } from 'lucide-react'
import { useResumeData } from '../context/ResumeData'

export default function Footer() {
  const { data } = useResumeData()
  const profile = data?.profile
  if (!profile) return null

  return (
    <footer className="border-t border-stone-200 bg-white/60">
      <div className="container-page py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-sm text-stone-500">
          © {new Date().getFullYear()} {profile.name}
        </p>

        <div className="flex items-center gap-2">
          <a
            href={`mailto:${profile.email}`}
            aria-label="Email"
            className="rounded-md p-2 text-stone-500 hover:text-accent transition-colors"
          >
            <Mail size={18} />
          </a>
          {profile.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="rounded-md p-2 text-stone-500 hover:text-accent transition-colors"
            >
              <Github size={18} />
            </a>
          )}
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="rounded-md p-2 text-stone-500 hover:text-accent transition-colors"
            >
              <Linkedin size={18} />
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
