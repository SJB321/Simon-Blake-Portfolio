import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
} from '@react-pdf/renderer'

import { profile } from '../data/profile.js'
import { skillGroups } from '../data/skills.js'
import { projects } from '../data/projects.js'
import { experience } from '../data/experience.js'
import { education } from '../data/education.js'

// Font URLs — Vite bundles these as static assets and gives us their hashed URLs.
import SourceSerifRegular from '@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff?url'
import SourceSerifItalic from '@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff?url'
import SourceSerifBold from '@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff?url'
import SourceSansRegular from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff?url'
import SourceSansItalic from '@fontsource/source-sans-3/files/source-sans-3-latin-400-italic.woff?url'
import SourceSansBold from '@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff?url'

Font.register({
  family: 'Source Serif',
  fonts: [
    { src: SourceSerifRegular },
    { src: SourceSerifItalic, fontStyle: 'italic' },
    { src: SourceSerifBold, fontWeight: 700 },
  ],
})

Font.register({
  family: 'Source Sans',
  fonts: [
    { src: SourceSansRegular },
    { src: SourceSansItalic, fontStyle: 'italic' },
    { src: SourceSansBold, fontWeight: 700 },
  ],
})

// react-pdf wraps lines too aggressively at hyphens by default. Disable that
// so URLs and long phrases don't break in awkward places.
Font.registerHyphenationCallback((word) => [word])

// Palette — pulled from the website so the PDF matches the site's identity.
const NAVY = '#1e3a5f'
const INK = '#1c1917'
const BODY = '#3f3a36'
const DIM = '#6b6660'
const RULE = '#c4c4c4'

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: 'Source Sans',
    fontSize: 9,
    color: BODY,
    lineHeight: 1.35,
  },

  // ── HEADER ────────────────────────────────────────────────
  name: {
    fontFamily: 'Source Serif',
    fontWeight: 700,
    fontSize: 22,
    color: INK,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'Source Serif',
    fontStyle: 'italic',
    fontSize: 10.5,
    color: DIM,
    marginTop: 2,
  },
  contactLine: {
    fontSize: 8.5,
    color: BODY,
    marginTop: 6,
  },

  // ── SECTION ───────────────────────────────────────────────
  sectionHeading: {
    fontFamily: 'Source Serif',
    fontWeight: 700,
    fontSize: 10,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 10,
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 0.6,
    borderBottomColor: RULE,
    borderBottomStyle: 'solid',
  },

  summary: {
    fontSize: 9,
    color: BODY,
    lineHeight: 1.35,
  },

  // ── EDUCATION ─────────────────────────────────────────────
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  eduSchool: {
    fontFamily: 'Source Sans',
    fontWeight: 700,
    fontSize: 10,
    color: INK,
  },
  eduPeriod: {
    fontSize: 9,
    color: DIM,
    fontStyle: 'italic',
  },
  eduDegree: {
    fontSize: 9,
    color: BODY,
    marginTop: 1,
  },
  eduSecondary: {
    fontSize: 9,
    color: BODY,
    marginTop: 1,
  },

  // ── SKILLS ────────────────────────────────────────────────
  skillRow: {
    flexDirection: 'row',
    fontSize: 9,
    marginTop: 1,
  },
  skillLabel: {
    fontFamily: 'Source Sans',
    fontWeight: 700,
    color: INK,
    width: 90,
  },
  skillValues: {
    flex: 1,
    color: BODY,
  },

  // ── PROJECTS / EXPERIENCE ENTRIES ─────────────────────────
  entry: {
    marginTop: 5,
  },
  entryTitle: {
    fontFamily: 'Source Sans',
    fontWeight: 700,
    fontSize: 10,
    color: INK,
  },
  entryRole: {
    fontSize: 9,
    color: DIM,
  },
  entryMeta: {
    fontSize: 9,
    color: DIM,
    fontStyle: 'italic',
  },
  entryLocation: {
    fontSize: 8.5,
    color: DIM,
    marginTop: 1,
  },
  entryDescription: {
    fontSize: 9,
    color: BODY,
    marginTop: 2,
  },
  entryTech: {
    fontSize: 8.5,
    color: DIM,
    marginTop: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 1,
    paddingLeft: 8,
  },
  bullet: {
    width: 8,
    fontSize: 9,
    color: NAVY,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: BODY,
  },
  linkText: {
    fontSize: 8.5,
    color: NAVY,
    marginTop: 2,
  },
})

// Strip the protocol so URLs read cleaner: https://github.com/x → github.com/x
const strip = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

// Tighten up the LinkedIn handle in profile (which is a full URL) into a path.
const linkedinDisplay = strip(profile.linkedin)
const githubDisplay = strip(profile.github)

export function ResumePdf() {
  // Skip placeholder projects — only real work belongs on a resume.
  const realProjects = projects.filter(
    (p) => !p.title.toLowerCase().includes('placeholder'),
  )

  return (
    <Document
      title={`${profile.name} — Resume`}
      author={profile.name}
      creator="Simon Blake Portfolio"
    >
      <Page size="LETTER" style={styles.page}>
        {/* ── HEADER ──────────────────────────────────────── */}
        <View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.subtitle}>
            Game Design &amp; Development · Rochester Institute of Technology
          </Text>
          <Text style={styles.contactLine}>
            {profile.email}
            {'  ·  '}
            {profile.phone}
            {'  ·  '}
            {profile.location}
            {'  ·  '}
            <Link src={profile.github} style={{ color: BODY }}>
              {githubDisplay}
            </Link>
            {'  ·  '}
            <Link src={profile.linkedin} style={{ color: BODY }}>
              {linkedinDisplay}
            </Link>
          </Text>
        </View>

        {/* ── SUMMARY ────────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Summary</Text>
        <Text style={styles.summary}>
          Game Design &amp; Development student at RIT focused on gameplay programming,
          physics and collision systems, and the engineering decisions that make games
          feel right. Seeking a Summer 2027 game development co-op to contribute to
          shipped projects and learn from industry professionals.
        </Text>

        {/* ── EDUCATION ──────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Education</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.eduSchool}>{education.school}</Text>
          <Text style={styles.eduPeriod}>{education.period}</Text>
        </View>
        <Text style={styles.eduDegree}>
          {education.degree}
          {'  ·  '}
          GPA {education.gpa}
          {'  ·  '}
          {education.location}
        </Text>
        <Text style={styles.eduSecondary}>
          <Text style={{ fontWeight: 700, color: INK }}>Honors: </Text>
          {education.honors.join('  ·  ')}
        </Text>
        <Text style={styles.eduSecondary}>
          <Text style={{ fontWeight: 700, color: INK }}>Coursework: </Text>
          {education.coursework.join(', ')}
        </Text>

        {/* ── TECHNICAL SKILLS ───────────────────────────── */}
        <Text style={styles.sectionHeading}>Technical Skills</Text>
        {skillGroups.map((group) => (
          <View key={group.title} style={styles.skillRow}>
            <Text style={styles.skillLabel}>{group.title}</Text>
            <Text style={styles.skillValues}>{group.items.join(', ')}</Text>
          </View>
        ))}

        {/* ── PROJECTS ───────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Projects</Text>
        {realProjects.map((project) => (
          <View key={project.title} style={styles.entry}>
            <View style={styles.rowBetween}>
              <Text>
                <Text style={styles.entryTitle}>{project.title}</Text>
                <Text style={styles.entryRole}>
                  {'  ·  '}
                  {project.role}
                </Text>
              </Text>
              <Text style={styles.entryMeta}>{project.year}</Text>
            </View>
            {project.tech?.length > 0 && (
              <Text style={styles.entryTech}>{project.tech.join('  ·  ')}</Text>
            )}
            {project.description && (
              <Text style={styles.entryDescription}>{project.description}</Text>
            )}
            {project.impact?.filter(Boolean).map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
            {(project.links?.github || project.links?.demo) && (
              <Text style={styles.linkText}>
                {project.links?.github && (
                  <>
                    <Text style={{ color: BODY }}>GitHub: </Text>
                    <Link src={project.links.github} style={{ color: NAVY }}>
                      {strip(project.links.github)}
                    </Link>
                  </>
                )}
                {project.links?.github && project.links?.demo && (
                  <Text style={{ color: DIM }}>{'    '}</Text>
                )}
                {project.links?.demo && (
                  <>
                    <Text style={{ color: BODY }}>Demo: </Text>
                    <Link src={project.links.demo} style={{ color: NAVY }}>
                      {strip(project.links.demo)}
                    </Link>
                  </>
                )}
              </Text>
            )}
          </View>
        ))}

        {/* ── EXPERIENCE ─────────────────────────────────── */}
        <Text style={styles.sectionHeading}>Experience</Text>
        {experience.map((job, i) => (
          <View key={i} style={styles.entry}>
            <View style={styles.rowBetween}>
              <Text>
                <Text style={styles.entryTitle}>{job.role}</Text>
                <Text style={styles.entryRole}>
                  {'  ·  '}
                  {job.company}
                </Text>
              </Text>
              <Text style={styles.entryMeta}>{job.period}</Text>
            </View>
            <Text style={styles.entryLocation}>{job.location}</Text>
            {job.points?.map((point, j) => (
              <View key={j} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}
