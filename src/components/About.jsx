import Reveal from './Reveal.jsx'
import SectionHeading from './SectionHeading.jsx'
import { useResumeData } from '../context/ResumeData.jsx'

export default function About() {
  const { data } = useResumeData()
  const about = data?.about
  if (!about) return null

  const paragraphs = Array.isArray(about.paragraphs) ? about.paragraphs : []
  const interests = Array.isArray(about.interests) ? about.interests : []

  return (
    <section id="about" className="section">
      <div className="container-page">
        <SectionHeading eyebrow="About" title="A bit about me" />

        <div className="mt-12 grid gap-12 lg:grid-cols-5 items-start">
          <Reveal delay={120} className="about-photo order-2 lg:order-none lg:col-start-4 lg:col-span-2 lg:row-start-1">
            <div className="group relative mx-auto w-full max-w-xs">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl border border-accent/40 transition-transform duration-300 group-hover:translate-x-2 group-hover:translate-y-2 no-print" />
              <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100 aspect-[4/5]">
                <img
                  src="/Profile.jpeg"
                  alt="Simon Blake"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </Reveal>

          <Reveal className="about-copy order-1 lg:order-none lg:col-start-1 lg:col-span-3 lg:row-start-1 space-y-5 text-stone-700 leading-relaxed">
            {paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}

            {interests.length > 0 && (
              <ul className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {interests.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-stone-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
