import Reveal from './Reveal.jsx'
import SectionHeading from './SectionHeading.jsx'

const interests = [
  'Gameplay and mechanics design',
  'Underlying physics, collisions, and game functions',
  'Artificial intelligence in workflows',
  'World building and game concept/narrative design',
]

export default function About() {
  return (
    <section id="about" className="section">
      <div className="container-page">
        <SectionHeading eyebrow="About" title="A bit about me" />

        <div className="mt-12 grid gap-12 lg:grid-cols-5 items-start">
          {/* Photo first in DOM (so float:right works in print). Grid placement
              keeps it on the right of the text on screen. */}
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
            <p>
              I&apos;m a sophomore at RIT studying Game Design & Development. I spend most of my time
              playing various formats of games be it physical or digital. Through my experience playing games,
              I have developed a respect for well crafted and polished games, so I am very passionate about well
              crafted, and mechanically fun and interesting games.
            </p>
            <p>
              I work well in collaborative environments as well as on my own. I have experience working on teams, such as
              a collaborative game I worked on "Portal Boyz", where I was primarily responsible for optimizing the physics and
              collisions. I also have experience working on individual projects such as *placeholder*.
            </p>
            <p>
              I&apos;m looking for a Summer 2027 game development co-op where I can learn from current industry
              professionals about good practices and how to optimize my workflow. I am also wish to meaningfully contribute
              to a project that I can take pride in.
            </p>

            <ul className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {interests.map((item) => (
                <li key={item} className="flex items-start gap-2 text-stone-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
