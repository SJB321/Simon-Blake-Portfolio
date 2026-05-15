// GET  /api/resume  → returns the entire resume payload
// PUT  /api/resume  → replaces the entire resume payload (admin-only)
//
// We serve the whole resume in one trip because every section is shown on the
// same page; splitting per-section would multiply network round-trips for no
// real win on a one-user site.
//
// Save semantics: PUT does a *full replace* — singletons get upsert'd, list
// sections get deleteMany + createMany inside a transaction so the order
// reflects exactly what the admin submitted.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from './_lib/prisma.js'
import { requireAuth } from './_lib/auth.js'

// Loose request-body shapes. The fields are validated at runtime below
// rather than via a static schema (zod, etc.) — overkill for one endpoint.
interface IncomingProfile {
  name?: string
  role?: string
  location?: string
  email?: string
  phone?: string | null
  github?: string | null
  linkedin?: string | null
  availability?: string | null
  tagline?: string | null
  intro?: string
  imageUrl?: string | null
}

interface IncomingAbout {
  paragraphs?: string[]
  interests?: string[]
}

interface IncomingEducation {
  school?: string
  college?: string | null
  degree?: string
  location?: string
  period?: string
  gpa?: string | null
  honors?: string[]
  coursework?: string[]
  imageUrl?: string | null
}

interface IncomingSkillGroup {
  title?: string
  items?: string[]
}

interface IncomingProject {
  title?: string
  role?: string
  year?: string
  description?: string
  impact?: string[]
  tech?: string[]
  githubUrl?: string | null
  demoUrl?: string | null
  imageUrl?: string | null
}

interface IncomingExperience {
  role?: string
  company?: string
  location?: string
  period?: string
  points?: string[]
  imageUrl?: string | null
}

interface ResumeWriteBody {
  profile?: IncomingProfile | null
  about?: IncomingAbout | null
  education?: IncomingEducation | null
  skillGroups?: IncomingSkillGroup[]
  projects?: IncomingProject[]
  experience?: IncomingExperience[]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') return getResume(res)
    if (req.method === 'PUT') return putResume(req, res)

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[/api/resume]', err)
    return res
      .status(500)
      .json({ error: 'Internal server error', detail: (err as Error).message })
  }
}

/** Load the canonical resume payload — shared by GET and PUT so both
 *  responses are byte-identical. Lets the client skip a follow-up refetch
 *  after save: PUT returns the same shape GET would have returned. */
async function loadResumePayload() {
  const [profile, about, education, skillGroups, projects, experience, settings, themes] =
    await Promise.all([
      prisma.profile.findUnique({ where: { id: 1 } }),
      prisma.about.findUnique({ where: { id: 1 } }),
      prisma.education.findUnique({ where: { id: 1 } }),
      prisma.skillGroup.findMany({ orderBy: { order: 'asc' } }),
      prisma.project.findMany({ orderBy: { order: 'asc' } }),
      prisma.experience.findMany({ orderBy: { order: 'asc' } }),
      prisma.settings.findUnique({ where: { id: 1 } }),
      prisma.theme.findMany({ orderBy: { createdAt: 'asc' } }),
    ])

  const activeTheme = settings?.activeThemeId
    ? themes.find((t) => t.id === settings.activeThemeId) ?? null
    : null

  return {
    profile,
    about,
    education,
    skillGroups,
    projects,
    experience,
    themes,
    activeTheme,
    activeThemeId: settings?.activeThemeId ?? null,
  }
}

async function getResume(res: VercelResponse) {
  // Don't cache at the edge — content is editable and we need post-save
  // refetches to see the latest data immediately. The function is cheap
  // (one parallel Prisma read) so the perf cost is negligible.
  res.setHeader('Cache-Control', 'no-store, must-revalidate')
  return res.status(200).json(await loadResumePayload())
}

async function putResume(req: VercelRequest, res: VercelResponse) {
  if (!(await requireAuth(req, res))) return

  const body = (req.body || {}) as ResumeWriteBody
  const errors = validate(body)
  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', issues: errors })
  }

  const {
    profile,
    about,
    education,
    skillGroups = [],
    projects = [],
    experience = [],
  } = body

  // Build Prisma-shaped data objects from the validated body.
  const profileData = profile
    ? {
        name: profile.name as string,
        role: profile.role ?? '',
        location: profile.location ?? '',
        email: profile.email as string,
        phone: emptyToNull(profile.phone),
        github: emptyToNull(profile.github),
        linkedin: emptyToNull(profile.linkedin),
        availability: emptyToNull(profile.availability),
        tagline: emptyToNull(profile.tagline),
        intro: profile.intro ?? '',
        imageUrl: emptyToNull(profile.imageUrl),
      }
    : null

  const aboutData = {
    paragraphs: (about?.paragraphs ?? []) as never,
    interests: (about?.interests ?? []) as never,
  }

  const educationData = education
    ? {
        school: education.school as string,
        college: emptyToNull(education.college),
        degree: education.degree as string,
        location: education.location ?? '',
        period: education.period ?? '',
        gpa: emptyToNull(education.gpa),
        honors: (education.honors ?? []) as never,
        coursework: (education.coursework ?? []) as never,
        imageUrl: emptyToNull(education.imageUrl),
      }
    : null

  if (!profileData || !educationData) {
    return res
      .status(400)
      .json({ error: 'profile and education are required objects' })
  }

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...profileData },
      update: profileData,
    }),
    prisma.about.upsert({
      where: { id: 1 },
      create: { id: 1, ...aboutData },
      update: aboutData,
    }),
    prisma.education.upsert({
      where: { id: 1 },
      create: { id: 1, ...educationData },
      update: educationData,
    }),

    prisma.skillGroup.deleteMany(),
    prisma.skillGroup.createMany({
      data: skillGroups.map((g, i) => ({
        title: String(g.title ?? ''),
        items: (g.items ?? []) as never,
        order: i,
      })),
    }),

    prisma.project.deleteMany(),
    prisma.project.createMany({
      data: projects.map((p, i) => ({
        title: String(p.title ?? ''),
        role: String(p.role ?? ''),
        year: String(p.year ?? ''),
        description: String(p.description ?? ''),
        impact: (p.impact ?? []) as never,
        tech: (p.tech ?? []) as never,
        githubUrl: emptyToNull(p.githubUrl),
        demoUrl: emptyToNull(p.demoUrl),
        imageUrl: emptyToNull(p.imageUrl),
        order: i,
      })),
    }),

    prisma.experience.deleteMany(),
    prisma.experience.createMany({
      data: experience.map((e, i) => ({
        role: String(e.role ?? ''),
        company: String(e.company ?? ''),
        location: String(e.location ?? ''),
        period: String(e.period ?? ''),
        points: (e.points ?? []) as never,
        imageUrl: emptyToNull(e.imageUrl),
        order: i,
      })),
    }),
  ])

  // Return the fresh canonical payload alongside `ok: true` so the client
  // can update its state without an extra round-trip back to GET /api/resume.
  const data = await loadResumePayload()
  return res.status(200).json({ ok: true, data })
}

function validate(body: ResumeWriteBody): string[] {
  const errors: string[] = []
  const trimmed = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

  if (!trimmed(body.profile?.name)) errors.push('profile.name is required')
  if (!trimmed(body.profile?.email)) errors.push('profile.email is required')
  if (!trimmed(body.education?.school)) errors.push('education.school is required')
  if (!trimmed(body.education?.degree)) errors.push('education.degree is required')

  for (const [i, p] of (body.projects || []).entries()) {
    if (!trimmed(p.title)) errors.push(`projects[${i}].title is required`)
  }
  for (const [i, e] of (body.experience || []).entries()) {
    if (!trimmed(e.role)) errors.push(`experience[${i}].role is required`)
    if (!trimmed(e.company)) errors.push(`experience[${i}].company is required`)
  }
  for (const [i, g] of (body.skillGroups || []).entries()) {
    if (!trimmed(g.title)) errors.push(`skillGroups[${i}].title is required`)
  }
  return errors
}

function emptyToNull(v: unknown): string | null {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length ? s : null
}
