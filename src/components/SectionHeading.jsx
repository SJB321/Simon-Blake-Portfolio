import Reveal from './Reveal.jsx'

export default function SectionHeading({ eyebrow, title, lead, align = 'left' }) {
  return (
    <Reveal className={align === 'center' ? 'text-center' : ''}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {lead && (
        <p className={`section-lead ${align === 'center' ? 'mx-auto' : ''}`}>{lead}</p>
      )}
    </Reveal>
  )
}
