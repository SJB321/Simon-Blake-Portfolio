import { ArrowRight, FileText, FolderGit2, Mail } from 'lucide-react'
import { profile } from '../data/profile.js'

export default function Hero() {
  const handleResume = () => window.print()

  return (
    <section id="top" className="relative pt-32 sm:pt-40 pb-24">
      <div className="container-page">
        <div className="max-w-3xl">
          <p className="font-serif italic text-base text-accent animate-fade-in print:hidden">
            Hello, my name is
          </p>

          <h1
            className="mt-4 font-serif text-5xl sm:text-6xl lg:text-6xl font-semibold tracking-tight text-stone-900 animate-fade-up"
            style={{ animationDelay: '80ms' }}
          >
            {profile.name}.
          </h1>

          <h2
            className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-stone-500 animate-fade-up"
            style={{ animationDelay: '160ms' }}
          >
            {profile.tagline}
          </h2>

          {/* Print-only contact strip — visible only in the PDF output */}
          <div className="hidden print-only mt-3 text-xs text-stone-700 leading-relaxed">
            <p>
              <span>{profile.email}</span>
              <span className="mx-2 text-stone-400">·</span>
              <span>{profile.github}</span>
              <span className="mx-2 text-stone-400">·</span>
              <span>{profile.linkedin}</span>
              <span className="mx-2 text-stone-400">·</span>
              <span>{profile.location}</span>
            </p>
          </div>

          <p
            className="mt-6 max-w-2xl text-stone-600 leading-relaxed animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            {profile.intro}
          </p>

          <div
            className="mt-10 flex flex-wrap items-center gap-3 animate-fade-up"
            style={{ animationDelay: '320ms' }}
          >
            <button type="button" onClick={handleResume} className="btn-primary" title="Save the site as a PDF">
              <FileText size={16} /> Resume
            </button>
            <a href="#projects" className="btn-secondary">
              <FolderGit2 size={16} /> Projects
            </a>
            <a href="#contact" className="btn-ghost">
              <Mail size={16} /> Contact
            </a>
          </div>

          <p
            className="hero-availability mt-12 inline-flex items-center gap-2 text-xs text-stone-500 animate-fade-up"
            style={{ animationDelay: '400ms' }}
          >
            <span className="hero-availability-dot h-1.5 w-1.5 rounded-full bg-accent" />
            {profile.availability}
            <ArrowRight size={12} className="text-stone-300" />
            seeking game development co-op
          </p>
        </div>
      </div>
    </section>
  )
}
