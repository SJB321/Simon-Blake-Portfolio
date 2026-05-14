import { Award, BookOpen, GraduationCap, MapPin } from 'lucide-react'
import Reveal from './Reveal'
import SectionHeading from './SectionHeading'
import { useResumeData } from '../context/ResumeData'

export default function Education() {
  const { data } = useResumeData()
  const education = data?.education
  if (!education) return null

  const honors = Array.isArray(education.honors) ? education.honors : []
  const coursework = Array.isArray(education.coursework) ? education.coursework : []

  return (
    <section id="education" className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Education" title="Academic background" />

        <Reveal className="mt-12">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                {education.imageUrl && (
                  <img
                    src={education.imageUrl}
                    alt={`${education.school} mark`}
                    loading="lazy"
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-md border border-stone-200 bg-stone-50 object-cover shrink-0 no-print"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-accent font-medium">
                    {education.degree}
                  </p>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-semibold text-stone-900">
                    {education.school}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">{education.college}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                    <MapPin size={12} /> {education.location}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs italic text-stone-500">{education.period}</p>
                <p className="mt-1 text-stone-700">
                  GPA <span className="font-semibold text-stone-900">{education.gpa}</span>
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent font-medium">
                  <Award size={14} /> Honors
                </h4>
                <ul className="mt-3 space-y-1.5 text-sm text-stone-700">
                  {honors.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <GraduationCap size={14} className="mt-1 shrink-0 text-accent" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent font-medium">
                  <BookOpen size={14} /> Relevant coursework
                </h4>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {coursework.map((c) => (
                    <li key={c} className="chip">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
