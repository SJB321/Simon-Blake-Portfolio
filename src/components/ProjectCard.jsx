import { ArrowUpRight, Github, ExternalLink } from 'lucide-react'

export default function ProjectCard({ project }) {
  const { title, role, year, description, impact, tech, links = {} } = project

  return (
    <article className="card group p-6 sm:p-7 flex flex-col h-full hover:-translate-y-0.5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent font-medium">
            {role}
            <span className="text-stone-400"> · </span>
            <span className="text-stone-500">{year}</span>
          </p>
          <h3 className="mt-2 font-serif text-xl font-semibold text-stone-900">{title}</h3>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-stone-500">
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noreferrer"
              aria-label={`${title} on GitHub`}
              className="rounded-md p-1.5 hover:text-accent transition-colors"
            >
              <Github size={18} />
            </a>
          )}
          {links.demo && (
            <a
              href={links.demo}
              target="_blank"
              rel="noreferrer"
              aria-label={`${title} demo`}
              className="rounded-md p-1.5 hover:text-accent transition-colors"
            >
              <ExternalLink size={18} />
            </a>
          )}
          {!links.github && !links.demo && (
            <span className="text-[10px] italic text-stone-400">links coming soon</span>
          )}
        </div>
      </header>

      <p className="mt-4 text-stone-600 text-sm leading-relaxed">{description}</p>

      {impact?.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm text-stone-600">
          {impact.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ArrowUpRight size={14} className="mt-1 shrink-0 text-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {(links.github || links.demo) && (
        <div className="hidden print-only mt-3 text-[10pt] text-stone-700 space-y-0.5">
          {links.github && <p>GitHub: {links.github}</p>}
          {links.demo && <p>Demo: {links.demo}</p>}
        </div>
      )}

      {tech?.length > 0 && (
        <div className="mt-auto pt-5 border-t border-stone-200">
          <p className="text-[11px] tracking-wide text-stone-500">
            {tech.join('  ·  ')}
          </p>
        </div>
      )}
    </article>
  )
}
