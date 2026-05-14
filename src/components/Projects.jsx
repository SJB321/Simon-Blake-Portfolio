import Reveal from './Reveal.jsx'
import SectionHeading from './SectionHeading.jsx'
import ProjectCard from './ProjectCard.jsx'
import { useResumeData } from '../context/ResumeData.jsx'

export default function Projects() {
  const { data } = useResumeData()
  const projects = data?.projects || []
  if (projects.length === 0) return null

  // ProjectCard expects { title, role, year, description, impact, tech, links: {github, demo} }
  // but DB returns the URLs as flat columns — adapt at the boundary.
  const toCard = (p) => ({
    title: p.title,
    role: p.role,
    year: p.year,
    description: p.description,
    impact: p.impact ?? [],
    tech: p.tech ?? [],
    imageUrl: p.imageUrl || null,
    links: {
      github: p.githubUrl || undefined,
      demo: p.demoUrl || undefined,
    },
  })

  return (
    <section id="projects" className="section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Projects"
          title="Selected work"
          lead="A few of the projects I've built or contributed to. More on GitHub."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.id ?? project.title} delay={i * 80}>
              <ProjectCard project={toCard(project)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
