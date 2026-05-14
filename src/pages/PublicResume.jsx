// The public-facing single-page portfolio. Loads its data from context
// (filled by <ResumeDataProvider> at app root) and renders the existing
// section components.

import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import About from '../components/About.jsx'
import Skills from '../components/Skills.jsx'
import Projects from '../components/Projects.jsx'
import Experience from '../components/Experience.jsx'
import Education from '../components/Education.jsx'
import Contact from '../components/Contact.jsx'
import Footer from '../components/Footer.jsx'
import { useResumeData } from '../context/ResumeData.jsx'

export default function PublicResume() {
  const { data, loading, error } = useResumeData()

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />
  if (!data) return <ErrorScreen error={new Error('No resume data found.')} />

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50
                   focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Education />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-500">
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  )
}

function ErrorScreen({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="font-serif text-2xl font-semibold text-stone-900">
          Couldn&apos;t load resume
        </h1>
        <p className="text-sm text-stone-600">
          Something went wrong fetching the content from the server. The most likely cause is a
          database connection issue — try refreshing in a moment.
        </p>
        <pre className="text-xs text-stone-500 bg-stone-100 rounded-md p-3 overflow-auto">
          {error?.message || String(error)}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-secondary"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
