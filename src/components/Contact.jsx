import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react'
import Reveal from './Reveal.jsx'
import { profile } from '../data/profile.js'

const channels = [
  { icon: Mail, label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
  { icon: Linkedin, label: 'LinkedIn', value: 'Connect on LinkedIn', href: profile.linkedin },
  { icon: Github, label: 'GitHub', value: 'See what I’m building', href: profile.github },
]

export default function Contact() {
  return (
    <section id="contact" className="section no-print">
      <div className="container-page max-w-3xl text-center">
        <Reveal>
          <p className="section-eyebrow">Contact</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-stone-900">
            Let&apos;s build something.
          </h2>
          <p className="mt-5 text-stone-600 leading-relaxed">
            I&apos;m looking for a Summer 2027 game development co-op. If you&apos;re hiring,
            collaborating on a project, or just want to talk about games — my inbox is open.
          </p>

          <a href={`mailto:${profile.email}`} className="btn-primary mt-8">
            <Mail size={16} /> {profile.email}
          </a>
        </Reveal>

        <Reveal delay={120} className="mt-12 grid gap-3 md:grid-cols-3 text-left">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
              className="card group p-5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-accent" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-500 font-medium">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-800">{value}</p>
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="text-stone-400 transition-all duration-200 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
