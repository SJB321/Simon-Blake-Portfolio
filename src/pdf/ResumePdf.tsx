import {
  Document,
  Page,
  Text,
  View,
  Font,
  Link,
} from '@react-pdf/renderer'
import type { ResumePayload, Theme } from '../types/resume'

/* ── FONT REGISTRATION ────────────────────────────────────────────
   We bundle all preset fonts via @fontsource so the PDF can render
   any of them regardless of the active theme. Custom Google Fonts
   typed by the user can't be loaded into react-pdf at runtime, so
   the PDF falls back to Source Serif / Source Sans for them.
   ──────────────────────────────────────────────────────────────── */

import SourceSerifRegular from '@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff?url'
import SourceSerifItalic from '@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff?url'
import SourceSerifBold from '@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff?url'
import SourceSansRegular from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff?url'
import SourceSansItalic from '@fontsource/source-sans-3/files/source-sans-3-latin-400-italic.woff?url'
import SourceSansBold from '@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff?url'

import PlayfairRegular from '@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff?url'
import PlayfairItalic from '@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff?url'
import PlayfairBold from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff?url'

import LoraRegular from '@fontsource/lora/files/lora-latin-400-normal.woff?url'
import LoraItalic from '@fontsource/lora/files/lora-latin-400-italic.woff?url'
import LoraBold from '@fontsource/lora/files/lora-latin-700-normal.woff?url'

import IbmPlexSerifRegular from '@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-normal.woff?url'
import IbmPlexSerifItalic from '@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-italic.woff?url'
import IbmPlexSerifBold from '@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-700-normal.woff?url'

import MerriweatherRegular from '@fontsource/merriweather/files/merriweather-latin-400-normal.woff?url'
import MerriweatherItalic from '@fontsource/merriweather/files/merriweather-latin-400-italic.woff?url'
import MerriweatherBold from '@fontsource/merriweather/files/merriweather-latin-700-normal.woff?url'

import InterRegular from '@fontsource/inter/files/inter-latin-400-normal.woff?url'
import InterBold from '@fontsource/inter/files/inter-latin-700-normal.woff?url'

import IbmPlexSansRegular from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff?url'
import IbmPlexSansItalic from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-italic.woff?url'
import IbmPlexSansBold from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff?url'

import WorkSansRegular from '@fontsource/work-sans/files/work-sans-latin-400-normal.woff?url'
import WorkSansBold from '@fontsource/work-sans/files/work-sans-latin-700-normal.woff?url'

import NunitoRegular from '@fontsource/nunito/files/nunito-latin-400-normal.woff?url'
import NunitoBold from '@fontsource/nunito/files/nunito-latin-700-normal.woff?url'

// Register all preset serif fonts under their actual family name. The keys
// here must match the `name` values in src/lib/fontPresets.ts.
Font.register({
  family: 'Source Serif 4',
  fonts: [
    { src: SourceSerifRegular },
    { src: SourceSerifItalic, fontStyle: 'italic' },
    { src: SourceSerifBold, fontWeight: 700 },
  ],
})
Font.register({
  family: 'Playfair Display',
  fonts: [
    { src: PlayfairRegular },
    { src: PlayfairItalic, fontStyle: 'italic' },
    { src: PlayfairBold, fontWeight: 700 },
  ],
})
Font.register({
  family: 'Lora',
  fonts: [
    { src: LoraRegular },
    { src: LoraItalic, fontStyle: 'italic' },
    { src: LoraBold, fontWeight: 700 },
  ],
})
Font.register({
  family: 'IBM Plex Serif',
  fonts: [
    { src: IbmPlexSerifRegular },
    { src: IbmPlexSerifItalic, fontStyle: 'italic' },
    { src: IbmPlexSerifBold, fontWeight: 700 },
  ],
})
Font.register({
  family: 'Merriweather',
  fonts: [
    { src: MerriweatherRegular },
    { src: MerriweatherItalic, fontStyle: 'italic' },
    { src: MerriweatherBold, fontWeight: 700 },
  ],
})
Font.register({
  family: 'Source Sans 3',
  fonts: [
    { src: SourceSansRegular },
    { src: SourceSansItalic, fontStyle: 'italic' },
    { src: SourceSansBold, fontWeight: 700 },
  ],
})
Font.register({
  family: 'Inter',
  fonts: [{ src: InterRegular }, { src: InterBold, fontWeight: 700 }],
})
Font.register({
  family: 'IBM Plex Sans',
  fonts: [
    { src: IbmPlexSansRegular },
    { src: IbmPlexSansItalic, fontStyle: 'italic' },
    { src: IbmPlexSansBold, fontWeight: 700 },
  ],
})
Font.register({
  family: 'Work Sans',
  fonts: [{ src: WorkSansRegular }, { src: WorkSansBold, fontWeight: 700 }],
})
Font.register({
  family: 'Nunito',
  fonts: [{ src: NunitoRegular }, { src: NunitoBold, fontWeight: 700 }],
})

// react-pdf wraps lines too aggressively at hyphens by default. Disable that
// so URLs and long phrases don't break in awkward places.
Font.registerHyphenationCallback((word) => [word])

const REGISTERED_SERIFS = new Set([
  'Source Serif 4',
  'Playfair Display',
  'Lora',
  'IBM Plex Serif',
  'Merriweather',
])
const REGISTERED_SANS = new Set([
  'Source Sans 3',
  'Inter',
  'IBM Plex Sans',
  'Work Sans',
  'Nunito',
])

const DEFAULT_SERIF = 'Source Serif 4'
const DEFAULT_SANS = 'Source Sans 3'
const DEFAULT_ACCENT = '#1e3a5f'

// Fixed palette — only the accent shifts with the theme; the body/ink/dim
// values stay constant to preserve readability and ATS scanning.
const INK = '#1c1917'
const BODY = '#3f3a36'
const DIM = '#6b6660'
const RULE = '#c4c4c4'

/** Pick a registered family that matches the requested name; fall back to
 *  the default when the user typed a custom Google Font we don't bundle. */
function pickSerif(requested: string | undefined): string {
  return requested && REGISTERED_SERIFS.has(requested) ? requested : DEFAULT_SERIF
}
function pickSans(requested: string | undefined): string {
  return requested && REGISTERED_SANS.has(requested) ? requested : DEFAULT_SANS
}

const strip = (url: string | null | undefined): string =>
  (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '')

interface ResumePdfProps {
  data: ResumePayload | null | undefined
}

export function ResumePdf({ data }: ResumePdfProps) {
  if (!data) return null
  const {
    profile,
    education,
    skillGroups = [],
    projects = [],
    experience = [],
    activeTheme,
  } = data
  if (!profile) return null

  // Resolve theme → concrete fonts / accent. Falls back to defaults when no
  // theme is active or the theme picked a font we don't bundle for PDF.
  const theme: Theme | null = activeTheme ?? null
  const serifFamily = pickSerif(theme?.headingFont)
  const sansFamily = pickSans(theme?.bodyFont)
  const accent = theme?.accentColor || DEFAULT_ACCENT

  const styles = buildStyles({ serifFamily, sansFamily, accent })

  // Skip placeholder projects — only real work belongs on a resume.
  const realProjects = projects.filter(
    (p) => !(p.title || '').toLowerCase().includes('placeholder'),
  )

  const projectsNormalized = realProjects.map((p) => ({
    ...p,
    links: { github: p.githubUrl, demo: p.demoUrl },
  }))

  const linkedinDisplay = strip(profile.linkedin)
  const githubDisplay = strip(profile.github)

  return (
    <Document
      title={`${profile.name} — Resume`}
      author={profile.name}
      creator="Simon Blake Portfolio"
    >
      <Page size="LETTER" style={styles.page}>
        {/* HEADER */}
        <View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.subtitle}>
            Game Design &amp; Development · Rochester Institute of Technology
          </Text>
          <Text style={styles.contactLine}>
            {profile.email}
            {profile.phone ? `  ·  ${profile.phone}` : ''}
            {profile.location ? `  ·  ${profile.location}` : ''}
            {profile.github && (
              <>
                {'  ·  '}
                <Link src={profile.github} style={{ color: BODY }}>
                  {githubDisplay}
                </Link>
              </>
            )}
            {profile.linkedin && (
              <>
                {'  ·  '}
                <Link src={profile.linkedin} style={{ color: BODY }}>
                  {linkedinDisplay}
                </Link>
              </>
            )}
          </Text>
        </View>

        {/* SUMMARY */}
        <Text style={styles.sectionHeading}>Summary</Text>
        <Text style={styles.summary}>
          Game Design &amp; Development student at RIT focused on gameplay programming,
          physics and collision systems, and the engineering decisions that make games
          feel right. Seeking a Summer 2027 game development co-op to contribute to
          shipped projects and learn from industry professionals.
        </Text>

        {/* EDUCATION */}
        {education && (
          <>
            <Text style={styles.sectionHeading}>Education</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.eduSchool}>{education.school}</Text>
              <Text style={styles.eduPeriod}>{education.period}</Text>
            </View>
            <Text style={styles.eduDegree}>
              {education.degree}
              {education.gpa ? `  ·  GPA ${education.gpa}` : ''}
              {education.location ? `  ·  ${education.location}` : ''}
            </Text>
            {Array.isArray(education.honors) && education.honors.length > 0 && (
              <Text style={styles.eduSecondary}>
                <Text style={{ fontWeight: 700, color: INK }}>Honors: </Text>
                {education.honors.join('  ·  ')}
              </Text>
            )}
            {Array.isArray(education.coursework) && education.coursework.length > 0 && (
              <Text style={styles.eduSecondary}>
                <Text style={{ fontWeight: 700, color: INK }}>Coursework: </Text>
                {education.coursework.join(', ')}
              </Text>
            )}
          </>
        )}

        {/* TECHNICAL SKILLS */}
        <Text style={styles.sectionHeading}>Technical Skills</Text>
        {skillGroups.map((group) => (
          <View key={group.title} style={styles.skillRow}>
            <Text style={styles.skillLabel}>{group.title}</Text>
            <Text style={styles.skillValues}>{group.items.join(', ')}</Text>
          </View>
        ))}

        {/* PROJECTS */}
        <Text style={styles.sectionHeading}>Projects</Text>
        {projectsNormalized.map((project) => (
          <View key={project.id ?? project.title} style={styles.entry}>
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
                    <Link src={project.links.github} style={{ color: accent }}>
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
                    <Link src={project.links.demo} style={{ color: accent }}>
                      {strip(project.links.demo)}
                    </Link>
                  </>
                )}
              </Text>
            )}
          </View>
        ))}

        {/* EXPERIENCE */}
        <Text style={styles.sectionHeading}>Experience</Text>
        {experience.map((job, i) => (
          <View key={job.id ?? i} style={styles.entry}>
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

interface StyleArgs {
  serifFamily: string
  sansFamily: string
  accent: string
}

// Building styles inside a function rather than via StyleSheet.create lets
// us swap fonts and the accent color per theme. The perf cost is negligible
// since this runs once per PDF render, not per element.
function buildStyles({ serifFamily, sansFamily, accent }: StyleArgs) {
  return {
    page: {
      paddingTop: 30,
      paddingBottom: 30,
      paddingLeft: 40,
      paddingRight: 40,
      fontFamily: sansFamily,
      fontSize: 9,
      color: BODY,
      lineHeight: 1.3,
    },
    name: {
      fontFamily: serifFamily,
      fontWeight: 700 as const,
      fontSize: 22,
      lineHeight: 1.1,
      color: INK,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontFamily: serifFamily,
      fontStyle: 'italic' as const,
      fontSize: 10.5,
      lineHeight: 1.25,
      color: DIM,
      marginTop: 6,
    },
    contactLine: {
      fontSize: 8.5,
      lineHeight: 1.35,
      color: BODY,
      marginTop: 6,
    },
    sectionHeading: {
      fontFamily: serifFamily,
      fontWeight: 700 as const,
      fontSize: 10,
      color: accent,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.2,
      marginTop: 6,
      marginBottom: 2,
      paddingBottom: 2,
      borderBottomWidth: 0.6,
      borderBottomColor: RULE,
      borderBottomStyle: 'solid' as const,
    },
    summary: {
      fontSize: 9,
      color: BODY,
      lineHeight: 1.3,
    },
    rowBetween: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'baseline' as const,
    },
    eduSchool: {
      fontFamily: sansFamily,
      fontWeight: 700 as const,
      fontSize: 10,
      color: INK,
    },
    eduPeriod: {
      fontSize: 9,
      color: DIM,
      fontStyle: 'italic' as const,
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
    skillRow: {
      flexDirection: 'row' as const,
      fontSize: 9,
      marginTop: 1,
    },
    skillLabel: {
      fontFamily: sansFamily,
      fontWeight: 700 as const,
      color: INK,
      width: 90,
    },
    skillValues: {
      flex: 1,
      color: BODY,
    },
    entry: {
      marginTop: 4,
    },
    entryTitle: {
      fontFamily: sansFamily,
      fontWeight: 700 as const,
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
      fontStyle: 'italic' as const,
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
      flexDirection: 'row' as const,
      marginTop: 1,
      paddingLeft: 8,
    },
    bullet: {
      width: 8,
      fontSize: 9,
      color: accent,
    },
    bulletText: {
      flex: 1,
      fontSize: 9,
      color: BODY,
    },
    linkText: {
      fontSize: 8.5,
      color: accent,
      marginTop: 2,
    },
  }
}
