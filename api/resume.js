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

import { prisma } from './_lib/prisma.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return getResume(res)
    if (req.method === 'PUT') return putResume(req, res)

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('[/api/resume]', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}

async function getResume(res) {
  const [profile, about, education, skillGroups, projects, experience] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.about.findUnique({ where: { id: 1 } }),
    prisma.education.findUnique({ where: { id: 1 } }),
    prisma.skillGroup.findMany({ orderBy: { order: 'asc' } }),
    prisma.project.findMany({ orderBy: { order: 'asc' } }),
    prisma.experience.findMany({ orderBy: { order: 'asc' } }),
  ])

  // Cache for 60s at the edge but always revalidate — public data, low write rate
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')

  return res.status(200).json({
    profile,
    about,
    education,
    skillGroups,
    projects,
    experience,
  })
}

async function putResume(req, res) {
  if (!(await requireAuth(req, res))) return

  const body = req.body || {}
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

  // Strip the password from any nested objects before persisting
  const cleanProfile = withoutPassword(profile)
  const cleanAbout = withoutPassword(about)
  const cleanEducation = withoutPassword(education)

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...cleanProfile },
      update: cleanProfile,
    }),
    prisma.about.upsert({
      where: { id: 1 },
      create: { id: 1, ...cleanAbout },
      update: cleanAbout,
    }),
    prisma.education.upsert({
      where: { id: 1 },
      create: { id: 1, ...cleanEducation, imageUrl: emptyToNull(cleanEducation?.imageUrl) },
      update: { ...cleanEducation, imageUrl: emptyToNull(cleanEducation?.imageUrl) },
    }),

    prisma.skillGroup.deleteMany(),
    prisma.skillGroup.createMany({
      data: skillGroups.map((g, i) => ({
        title: g.title,
        items: g.items,
        order: i,
      })),
    }),

    prisma.project.deleteMany(),
    prisma.project.createMany({
      data: projects.map((p, i) => ({
        title: p.title,
        role: p.role,
        year: p.year,
        description: p.description,
        impact: p.impact ?? [],
        tech: p.tech ?? [],
        githubUrl: emptyToNull(p.githubUrl),
        demoUrl: emptyToNull(p.demoUrl),
        imageUrl: emptyToNull(p.imageUrl),
        order: i,
      })),
    }),

    prisma.experience.deleteMany(),
    prisma.experience.createMany({
      data: experience.map((e, i) => ({
        role: e.role,
        company: e.company,
        location: e.location,
        period: e.period,
        points: e.points ?? [],
        imageUrl: emptyToNull(e.imageUrl),
        order: i,
      })),
    }),
  ])

  return res.status(200).json({ ok: true })
}

function validate(body) {
  const errors = []
  if (!body.profile?.name?.trim()) errors.push('profile.name is required')
  if (!body.profile?.email?.trim()) errors.push('profile.email is required')
  if (!body.education?.school?.trim()) errors.push('education.school is required')
  if (!body.education?.degree?.trim()) errors.push('education.degree is required')

  for (const [i, p] of (body.projects || []).entries()) {
    if (!p.title?.trim()) errors.push(`projects[${i}].title is required`)
  }
  for (const [i, e] of (body.experience || []).entries()) {
    if (!e.role?.trim()) errors.push(`experience[${i}].role is required`)
    if (!e.company?.trim()) errors.push(`experience[${i}].company is required`)
  }
  for (const [i, g] of (body.skillGroups || []).entries()) {
    if (!g.title?.trim()) errors.push(`skillGroups[${i}].title is required`)
  }
  return errors
}

function withoutPassword(obj) {
  if (!obj) return obj
  // eslint-disable-next-line no-unused-vars
  const { __password, id, updatedAt, ...rest } = obj
  return rest
}

function emptyToNull(v) {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length ? s : null
}
