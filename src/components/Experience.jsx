import Reveal from './Reveal.jsx'
import SectionHeading from './SectionHeading.jsx'
import { experience } from '../data/experience.js'

export default function Experience() {
  return (
    <section id="experience" className="section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Experience"
          title="Where I've worked"
          lead="A mix of seasonal work, on-set production, and instruction roles — each one taught me something about showing up, owning a piece of a system, and shipping under pressure."
        />

        <ol className="mt-12 border-l border-stone-200 ml-3 space-y-10">
          {experience.map((job, i) => (
            <Reveal key={`${job.company}-${i}`} as="li" delay={i * 100} className="pl-8 relative">
              <span className="absolute -left-[6.5px] top-1.5 h-3 w-3 rounded-full bg-stone-50 border-2 border-accent" />

              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-lg font-semibold text-stone-900">
                  {job.role}
                  <span className="text-accent"> · </span>
                  <span className="text-stone-700 font-normal">{job.company}</span>
                </h3>
                <p className="text-xs italic text-stone-500">{job.period}</p>
              </div>

              <p className="mt-1 text-xs text-stone-500">{job.location}</p>

              <ul className="mt-3 space-y-1.5 text-sm text-stone-600">
                {job.points.map((point, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
