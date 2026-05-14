import Reveal from './Reveal.jsx'
import SectionHeading from './SectionHeading.jsx'
import { useResumeData } from '../context/ResumeData.jsx'

export default function Skills() {
  const { data } = useResumeData()
  const skillGroups = data?.skillGroups || []
  if (skillGroups.length === 0) return null

  return (
    <section id="skills" className="section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Skills"
          title="What I have experience in"
          lead="Here are some of the languages and frameworks I have worked with.
           If there is something specific you are looking for please reach out!
            I am confident in my ability to learn something new."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {skillGroups.map((group, i) => (
            <Reveal key={group.title} delay={i * 80}>
              <div className="card h-full p-6">
                <h3 className="text-xs uppercase tracking-[0.18em] text-accent font-medium">
                  {group.title}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li key={item} className="chip">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}