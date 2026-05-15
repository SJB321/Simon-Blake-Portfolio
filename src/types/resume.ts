// Shared resume data types.
//
// These mirror the Prisma schema but represent the JSON-serialized shapes that
// travel over the wire — so Date columns are typed as strings (since
// `Date.toJSON()` produces an ISO string), and JSON columns are typed as
// concrete arrays rather than Prisma's catch-all `JsonValue`.

export interface Profile {
  id: number
  name: string
  role: string
  location: string
  email: string
  phone: string | null
  github: string | null
  linkedin: string | null
  availability: string | null
  tagline: string | null
  intro: string
  imageUrl: string | null
  updatedAt: string
}

export interface About {
  id: number
  paragraphs: string[]
  interests: string[]
  updatedAt: string
}

export interface Education {
  id: number
  school: string
  college: string | null
  degree: string
  location: string
  period: string
  gpa: string | null
  honors: string[]
  coursework: string[]
  imageUrl: string | null
  updatedAt: string
}

export interface SkillGroup {
  id: number
  title: string
  items: string[]
  order: number
  updatedAt: string
}

export interface Project {
  id: number
  title: string
  role: string
  year: string
  description: string
  impact: string[]
  tech: string[]
  githubUrl: string | null
  demoUrl: string | null
  imageUrl: string | null
  order: number
  updatedAt: string
}

export interface Experience {
  id: number
  role: string
  company: string
  location: string
  period: string
  points: string[]
  imageUrl: string | null
  order: number
  updatedAt: string
}

export interface Theme {
  id: number
  name: string
  description: string | null
  headingFont: string
  headingFontUrl: string | null
  bodyFont: string
  bodyFontUrl: string | null
  accentColor: string
  spacing: 'compact' | 'comfortable' | 'spacious' | string
  createdAt: string
  updatedAt: string
}

/** What `GET /api/resume` returns. Any of the singletons may be null on a
 *  fresh database before seeding. */
export interface ResumePayload {
  profile: Profile | null
  about: About | null
  education: Education | null
  skillGroups: SkillGroup[]
  projects: Project[]
  experience: Experience[]
  themes: Theme[]
  activeTheme: Theme | null
  activeThemeId: number | null
}

/** Image stored in Supabase Storage, as surfaced by `GET /api/images`. */
export interface ImageItem {
  name: string
  size: number | null
  contentType: string | null
  createdAt: string | null
  url: string
}
