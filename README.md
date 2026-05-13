# Simon Blake — Portfolio

Personal portfolio site for Simon Blake (Game Design & Development major at RIT).

Built with **React 18**, **Vite**, and **Tailwind CSS**. Component-based, fully responsive, accessible, and easy to keep editing as new projects ship.

---

## Getting started

```bash
cd ResumeSite
npm install
npm run dev
```

Open <http://localhost:5173>. Hot reload is on — edits show up immediately.

To produce a production build:

```bash
npm run build
npm run preview   # serve the built site locally to sanity-check
```

The contents of `dist/` are static and can be dropped onto Vercel, Netlify, GitHub Pages, Cloudflare Pages, or any static host.

---

## Project structure

```
ResumeSite/
├── public/
│   ├── favicon.svg
│   ├── profile.jpg          ← add your headshot here (any 4:5 image)
│   └── resume.pdf           ← add your resume PDF here
├── src/
│   ├── main.jsx             ← React entry point
│   ├── App.jsx              ← composes all sections
│   ├── index.css            ← Tailwind directives + base styles
│   ├── hooks/
│   │   └── useInView.js     ← IntersectionObserver hook for scroll reveals
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Skills.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectCard.jsx  ← reusable project card
│   │   ├── Experience.jsx
│   │   ├── Education.jsx
│   │   ├── Contact.jsx
│   │   ├── Footer.jsx
│   │   ├── Reveal.jsx       ← scroll-fade wrapper
│   │   └── SectionHeading.jsx
│   └── data/
│       ├── profile.js       ← name, tagline, email, socials, intro
│       ├── skills.js        ← grouped skill chips
│       ├── projects.js      ← project cards
│       ├── experience.js    ← timeline entries
│       └── education.js     ← school, GPA, honors, coursework
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

Content lives in `src/data/*.js`. **Edit those files first** — every section reads from there.

---

## What you need to add

A few placeholders are intentionally left for you to fill in:

| What | Where | Notes |
|------|-------|-------|
| Profile photo | `public/profile.jpg` | About section has the placeholder. Then uncomment the `<img>` line in [src/components/About.jsx](src/components/About.jsx). A vertical 4:5 portrait at ~800×1000 looks best. |
| Resume PDF | `public/resume.pdf` | Wired up by `/resume.pdf` links in the Navbar and Hero. |
| GitHub URL | `src/data/profile.js` → `github` | Replace `your-username`. |
| LinkedIn URL | `src/data/profile.js` → `linkedin` | Replace `your-handle`. |
| Real projects | `src/data/projects.js` | Replace the two placeholder cards with real work. See the *Adding a project* section below. |
| Project links | `src/data/projects.js` → `links` | Each project supports `github` and `demo` URLs; uncomment when ready. |
| Coursework | `src/data/education.js` → `coursework` | I filled in plausible CS/game-dev courses — swap in your real ones each semester. |

### Suggested image / content ideas

- **Profile photo:** a clean, well-lit headshot in front of a plain wall — or a candid shot at a desk with Unity open. Avoid heavy filters.
- **Project hero images** (future addition): in-engine screenshots > rendered marketing art. Even a clean editor screenshot reads as more authentic than a logo.
- **GIFs:** a 3–5 second loop of a mechanic in motion sells a gameplay project better than any paragraph.
- **Featured project:** mark your single strongest project with `featured: true` so it gets the Featured badge.

---

## Adding a project

In [src/data/projects.js](src/data/projects.js), append:

```js
{
  title: 'Project Name',
  role: 'Your role',              // e.g. "Lead Programmer"
  year: '2026',
  description: 'One or two sentences about what it is and what was interesting.',
  impact: [
    'A concrete result — system shipped, problem solved, metric moved.',
    'A second outcome, ideally framed in terms of impact on the player or team.',
  ],
  tech: ['Unity', 'C#'],
  links: {
    github: 'https://github.com/you/repo',
    demo: 'https://example.com',
  },
  featured: false,                // set true for your single best project
},
```

Order matters — the array order is the display order. Lead with your strongest.

---

## Tweaking the design

- **Accent color** — change `colors.accent` in [tailwind.config.js](tailwind.config.js). Currently teal (`#2dd4bf`). Swap for any hex.
- **Fonts** — Inter (body) and JetBrains Mono (code/labels) are loaded from Google Fonts in [index.html](index.html). Replace the `<link>` and update `fontFamily` in `tailwind.config.js` to change.
- **Section copy** — every heading, eyebrow, and lead sentence lives in its component under `src/components/`. They're short, intentionally — keep edits short too.
- **Animations** — fade-in / fade-up are defined in `tailwind.config.js` keyframes, plus a reveal-on-scroll via `src/hooks/useInView.js`. Reduce or remove by deleting `<Reveal>` wrappers.

---

## Deploy

The recommended path is **Vercel**:

1. Push the `ResumeSite` folder to a GitHub repo.
2. Go to <https://vercel.com/new>, import the repo, accept the auto-detected Vite settings.
3. First deploy ships in ~30 seconds; every future `git push` rebuilds automatically.

Alternatives: Netlify, Cloudflare Pages, GitHub Pages — all work the same way (build command `npm run build`, output directory `dist`).

---

## Accessibility notes

- Single semantic landmark per section (`<section>`, `<nav>`, `<main>`, `<footer>`).
- Skip-to-content link visible on keyboard focus.
- All interactive elements are real `<a>` or `<button>` — no fake divs.
- Focus rings preserved via `:focus-visible` styling.
- Color contrast checked against WCAG AA on the teal accent + zinc palette.

If you add custom imagery, **add real `alt` text**. The placeholders in the About section show where.
