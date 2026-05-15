// Seeds the database with the resume content that previously lived in
// src/data/*.js (and hard-coded in About.jsx).
//
// Run with:  npm run db:seed
//
// Safe to run repeatedly — uses upsert for singletons and deleteMany+createMany
// for repeating sections, so re-seeding resets to this canonical state without
// duplicates. Don't run after the user has edited live data, or you'll wipe it.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const profile = {
  name: 'Simon Blake',
  role: 'Game Design & Development Student',
  location: 'Rochester, NY',
  email: 'ekalb.sy@gmail.com',
  phone: '781-995-7119',
  github: 'https://github.com/SJB321',
  linkedin: 'https://www.linkedin.com/in/simon-james-blake/',
  availability: 'Available Summer 2027',
  tagline: 'I build games for the love of the game.',
  intro:
    "I'm a Game Design & Development student at the Rochester Institute of Technology. I focus on gameplay mechanics and ideas, programming those ideas, and automating the process to maxemize my efficiency. I care about creating effective code and making fun games that I can be proud of.",
}

const about = {
  paragraphs: [
    "I'm a sophomore at RIT studying Game Design & Development. I spend most of my time playing various formats of games be it physical or digital. Through my experience playing games, I have developed a respect for well crafted and polished games, so I am very passionate about well crafted, and mechanically fun and interesting games.",
    'I work well in collaborative environments as well as on my own. I have experience working on teams, such as a collaborative game I worked on "Portal Boyz", where I was primarily responsible for optimizing the physics and collisions. I also have experience working on individual projects such as *placeholder*.',
    "I'm looking for a Summer 2027 game development co-op where I can learn from current industry professionals about good practices and how to optimize my workflow. I am also wish to meaningfully contribute to a project that I can take pride in.",
  ],
  interests: [
    'Gameplay and mechanics design',
    'Underlying physics, collisions, and game functions',
    'Artificial intelligence in workflows',
    'World building and game concept/narrative design',
  ],
}

const education = {
  school: 'Rochester Institute of Technology',
  college: 'College of Computing and Information Sciences',
  degree: 'B.S. Game Design and Development',
  location: 'Rochester, NY',
  period: '2024 - Expected May 2028',
  gpa: '3.64',
  honors: ['Presidential Scholarship', "Dean's List - Spring 2025"],
  coursework: [
    'C#/C++ fundamentals',
    'Web development fundamentals',
    'Unity development',
    '2D/3D animation/modeling',
    'UI/UX design',
    'Discrete Mathematics',
  ],
}

const skillGroups = [
  { title: 'Languages', items: ['C#', 'C++', 'Python', 'JavaScript', 'HTML / CSS'] },
  { title: 'Engines & Frameworks', items: ['Unity', 'Visual Studio', '.NET'] },
  { title: 'Tools', items: ['Git', 'GitHub'] },
  {
    title: 'Concepts',
    items: [
      'Gameplay Programming',
      'Fundamental Game Features (physics, collisions, input, etc.)',
      'Object-Oriented Design',
      'Autonomous Agents & game AI',
    ],
  },
]

const projects = [
  {
    title: 'Portal Platformer',
    role: 'Collisions Manager',
    year: '2025',
    description:
      'Team-built 2D platformer with a portal mechanic. I owned the collision system in the project and was in charge of resolving all issues that would arise related to it.',
    impact: [
      'Designed the collision system and implemented it.',
      'Contributed greatly to bugfixing after finished development of the collision system.',
    ],
    tech: ['C#', 'Monogame', 'Visual Studio'],
    githubUrl: 'https://github.com/Charlie-GCCIS/FFPO_106',
    demoUrl: null,
  },
  {
    title: 'Autonomous Agent Experimentation',
    role: 'Sole Developer',
    year: '2026',
    description:
      'This project involved applying knowledge of autonomous agents to simulate an environment. I created a space themed environment with two types of agents: a friendly ship and an enemy ship. The friendly ship navigates to different planets with other ships while avoiding enemies and hazards, while the enemy ship wanders around and chases friendly ships if they get too close.',
    impact: [],
    tech: ['Unity', 'C#'],
    githubUrl: null,
    demoUrl: 'https://igme-202-2255.github.io/202-work-SJB10/Project_03/',
  },
]

const experience = [
  {
    role: 'Bike Delivery',
    company: "Young's Bicycle Shop",
    location: 'Nantucket, MA',
    period: 'Summer 2024',
    points: [
      'Full-time seasonal role delivering and managing the rental bike fleet across the island.',
      'Gained experience in customer service/sales through helping to rent bikes to customers after deliveries were finished.',
    ],
  },
  {
    role: 'Background Actor',
    company: 'The Walking Dead: Dead City (Season 2)',
    location: 'Taunton, MA',
    period: 'Spring 2024',
    points: [
      'Cast as a survivor (extra) on an AMC production.',
      'Was in a few scenes in the beginning of the series.',
      'Learned about production process because of my interest in acting and entertainment industries.',
    ],
  },
  {
    role: 'Seasonal Ski Instructor',
    company: 'Stratton Mountain',
    location: 'Stratton, VT',
    period: 'Nov 2021 - Mar 2023',
    points: [
      'Taught ages 4-12 in groups of up to eight after completing the training.',
      'Mentored junior instructors and worked weekends through the school year plus winter and spring breaks.',
    ],
  },
]

async function main() {
  console.log('→ Seeding database…')

  await prisma.profile.upsert({
    where: { id: 1 },
    create: { id: 1, ...profile },
    update: profile,
  })
  console.log('  ✓ profile')

  await prisma.about.upsert({
    where: { id: 1 },
    create: { id: 1, ...about },
    update: about,
  })
  console.log('  ✓ about')

  await prisma.education.upsert({
    where: { id: 1 },
    create: { id: 1, ...education },
    update: education,
  })
  console.log('  ✓ education')

  await prisma.skillGroup.deleteMany()
  await prisma.skillGroup.createMany({
    data: skillGroups.map((g, i) => ({ ...g, order: i })),
  })
  console.log(`  ✓ skill groups (${skillGroups.length})`)

  await prisma.project.deleteMany()
  await prisma.project.createMany({
    data: projects.map((p, i) => ({ ...p, order: i })),
  })
  console.log(`  ✓ projects (${projects.length})`)

  await prisma.experience.deleteMany()
  await prisma.experience.createMany({
    data: experience.map((e, i) => ({ ...e, order: i })),
  })
  console.log(`  ✓ experience (${experience.length})`)

  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, passwordHash: null },
    update: {}, // don't clobber a password the user has already set
  })
  console.log('  ✓ settings (no password configured; admin is open until you set one)')

  // Seed three starter themes so the admin opens to a populated library.
  // Only insert if there are no themes yet — never clobber user-saved ones.
  // One-time cleanup of starter themes that were renamed in this version.
  // Safe to leave in long-term — these names are no longer seeded.
  const supersededNames = ['Modern Editorial', 'Studio Compact']
  const supersededDeleted = await prisma.theme.deleteMany({
    where: { name: { in: supersededNames } },
  })
  if (supersededDeleted.count > 0) {
    console.log(
      `  ↻ removed ${supersededDeleted.count} superseded starter theme(s)`,
    )
  }

  // Seed starter themes. Safe to re-run: each is upserted by name, so a theme
  // the user has hand-edited (different name) is never touched. Existing
  // theme rows with these *exact* names are refreshed to canonical values.
  const _starterThemesAlwaysCreate = [
      {
        // 1. The current look — neutral, classic, navy.
        name: 'Stone Serif (Default)',
        description:
          'The current look — clean off-white page, white cards, navy accent. Comfortable spacing.',
        headingFont: 'Source Serif 4',
        bodyFont: 'Source Sans 3',
        accentColor: '#1e3a5f',
        backgroundColor: '#fafaf9',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#e7e5e4',
        spacing: 'comfortable',
      },
      {
        // 2. Warm, magazine-style — fully serif, cream paper, sienna accent,
        //    spacious section gaps to feel airy.
        name: 'Warm Editorial',
        description:
          'Magazine-style serif on cream paper. Sienna accent, spacious rhythm. Both heading and body in serif.',
        headingFont: 'Playfair Display',
        headingFontUrl:
          'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap',
        bodyFont: 'Lora',
        bodyFontUrl:
          'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;700&display=swap',
        accentColor: '#9c3d2a',
        backgroundColor: '#faf6f0',
        cardBackgroundColor: '#fffaf2',
        cardBorderColor: '#e8dccb',
        spacing: 'spacious',
      },
      {
        // 3. Modern technical — slate accent, cool gray surfaces, both Plex
        //    fonts, tighter spacing for an information-dense feel.
        name: 'Studio Minimal',
        description:
          'Cool grays, slate accent, IBM Plex pair. Compact spacing for an information-dense, technical feel.',
        headingFont: 'IBM Plex Serif',
        headingFontUrl:
          'https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600;700&display=swap',
        bodyFont: 'IBM Plex Sans',
        bodyFontUrl:
          'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
        accentColor: '#475569',
        backgroundColor: '#f1f5f9',
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#cbd5e1',
        spacing: 'compact',
      },
      {
        // 4. Bold geometric — all sans, single-font typography (Work Sans
        //    everywhere with weight contrast). High-contrast pink accent on
        //    white. Stronger borders for graphic definition.
        name: 'Bold Geometric',
        description:
          'High-contrast, sans-only typography with a bold pink accent. Strong card borders for graphic definition.',
        headingFont: 'Work Sans',
        headingFontUrl:
          'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap',
        bodyFont: 'Work Sans',
        bodyFontUrl:
          'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap',
        accentColor: '#db2777',
        backgroundColor: '#ffffff',
        cardBackgroundColor: '#fafaf9',
        cardBorderColor: '#1c1917',
        spacing: 'comfortable',
      },
    ]
  for (const t of _starterThemesAlwaysCreate) {
    await prisma.theme.upsert({
      where: { name: t.name },
      create: t,
      update: t,
    })
  }
  // Activate the default — but only if no theme is currently active. This
  // way re-seeding never overrides a user's active-theme choice.
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })
  if (!settings?.activeThemeId) {
    const def = await prisma.theme.findUnique({
      where: { name: 'Stone Serif (Default)' },
    })
    if (def) {
      await prisma.settings.update({
        where: { id: 1 },
        data: { activeThemeId: def.id },
      })
    }
  }
  console.log(
    `  ✓ themes (${_starterThemesAlwaysCreate.length}) upserted by name`,
  )

  console.log('✔ seed complete')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
