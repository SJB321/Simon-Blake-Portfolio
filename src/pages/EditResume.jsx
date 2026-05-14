// Admin edit page.
//
// Pre-populates from the same ResumeData context that powers the public site,
// keeps everything in local form state until Save (so Cancel can discard
// cleanly), and PUTs the full payload back through the resume endpoint.
//
// Auth: the password arrives via router state from the password modal on the
// public page. We hold it in component state for the duration of this session
// — never in localStorage. Refreshing /edit directly will redirect back to /.

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Trash2, KeyRound } from 'lucide-react'
import { useResumeData } from '../context/ResumeData.jsx'
import { api } from '../lib/api.js'

export default function EditResume() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data, loading, error, refetch } = useResumeData()

  // Password arrives from the public page's password modal. We hold a
  // mutable copy in state so PasswordForm can update it after a change —
  // otherwise the next Save would send the stale password and 401.
  const initialPassword = location.state?.password
  const [password, setPassword] = useState(initialPassword)
  useEffect(() => {
    if (initialPassword === undefined) navigate('/', { replace: true })
  }, [initialPassword, navigate])

  // Local working copy of the resume payload — initialized from context once
  // data loads. Edits stay here until Save; Cancel just discards by leaving.
  const [draft, setDraft] = useState(null)
  useEffect(() => {
    if (data && !draft) setDraft(deepClone(data))
  }, [data, draft])

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  if (loading || !draft) {
    return <CenteredMessage>Loading…</CenteredMessage>
  }
  if (error) {
    return <CenteredMessage error>Couldn't load — {error.message}</CenteredMessage>
  }
  if (initialPassword === undefined) return null // redirecting

  const update = (path, value) => {
    setDraft((d) => setIn(d, path, value))
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await api.putResume(draft, password)
      setSaveSuccess(true)
      await refetch()
      // Auto-hide the success banner after a moment
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <EditHeader onBack={handleCancel} />

      <main className="container-page max-w-4xl py-8 space-y-8 pb-32">
        <Section title="Hero / Profile" description="Name, role, contact info, and the opening tagline.">
          <ProfileForm profile={draft.profile} onChange={(v) => update(['profile'], v)} />
        </Section>

        <Section title="About" description="Narrative paragraphs and your areas of interest.">
          <AboutForm about={draft.about} onChange={(v) => update(['about'], v)} />
        </Section>

        <Section title="Skills" description="Grouped skill chips. Order is preserved.">
          <SkillsForm
            groups={draft.skillGroups}
            onChange={(v) => update(['skillGroups'], v)}
          />
        </Section>

        <Section title="Projects" description="Real work to feature. Top of the list shows first.">
          <ProjectsForm
            projects={draft.projects}
            onChange={(v) => update(['projects'], v)}
          />
        </Section>

        <Section title="Experience" description="Jobs and roles, newest first by convention.">
          <ExperienceForm
            entries={draft.experience}
            onChange={(v) => update(['experience'], v)}
          />
        </Section>

        <Section title="Education" description="School, degree, honors, coursework.">
          <EducationForm
            education={draft.education}
            onChange={(v) => update(['education'], v)}
          />
        </Section>

        <Section title="Admin password" description="Set or change the password that gates this edit page.">
          <PasswordForm
            currentPassword={password}
            onPasswordChanged={setPassword}
          />
        </Section>
      </main>

      <SaveBar
        saving={saving}
        saveError={saveError}
        saveSuccess={saveSuccess}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}

/* -----------------------------------------------------------
   Layout helpers
   ----------------------------------------------------------- */

function EditHeader({ onBack }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="container-page max-w-4xl h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-accent transition-colors"
        >
          <ArrowLeft size={16} /> Back to site
        </button>
        <p className="font-serif text-sm text-stone-500">Edit resume</p>
      </div>
    </header>
  )
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white">
      <div className="border-b border-stone-100 px-5 py-4">
        <h2 className="font-serif text-lg font-semibold text-stone-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-stone-500">{description}</p>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  )
}

function SaveBar({ saving, saveError, saveSuccess, onSave, onCancel }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur">
      <div className="container-page max-w-4xl flex items-center justify-between gap-4 h-16">
        <div className="text-sm text-stone-600 min-h-[1.25rem]">
          {saveError && <span className="text-red-600">{saveError}</span>}
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <Check size={14} /> Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="btn-primary text-sm disabled:opacity-60 disabled:cursor-wait"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CenteredMessage({ children, error }) {
  return (
    <div className={`min-h-screen flex items-center justify-center text-sm ${error ? 'text-red-600' : 'text-stone-500'}`}>
      {children}
    </div>
  )
}

/* -----------------------------------------------------------
   Reusable form atoms
   ----------------------------------------------------------- */

// Tailwind requires class names to appear as complete literals at build time;
// we can't use `col-span-${n}` interpolation. So we hand-map the values we
// actually use to their static classes.
const SPAN_CLASSES = {
  1: '',
  2: 'col-span-2',
  3: 'col-span-3',
}

function Field({ label, hint, children, span = 1 }) {
  return (
    <label className={`block ${SPAN_CLASSES[span] || ''}`}>
      <span className="block text-xs font-medium text-stone-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="block mt-1 text-[11px] text-stone-500">{hint}</span>}
    </label>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm placeholder-stone-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
        props.className || ''
      }`}
    />
  )
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm placeholder-stone-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
        props.className || ''
      }`}
    />
  )
}

/** Editable list of strings with add/remove controls. */
function StringList({ values, onChange, placeholder = '', allowEmpty = true }) {
  const items = Array.isArray(values) ? values : []
  return (
    <div className="space-y-2">
      {items.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={value}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items]
              next[i] = e.target.value
              onChange(next)
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="rounded-md p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, allowEmpty ? '' : placeholder])}
        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
      >
        <Plus size={12} /> Add
      </button>
    </div>
  )
}

/** Repeating-row container with add/remove for any item shape. */
function ItemList({ items, onChange, renderItem, makeEmpty, addLabel = 'Add item' }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id ?? i} className="relative rounded-lg border border-stone-200 bg-stone-50/40 p-4">
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="absolute right-3 top-3 rounded-md p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Remove this entry"
          >
            <Trash2 size={14} />
          </button>
          {renderItem(item, (patch) => {
            const next = [...items]
            next[i] = typeof patch === 'function' ? patch(item) : { ...item, ...patch }
            onChange(next)
          })}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, makeEmpty()])}
        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
      >
        <Plus size={12} /> {addLabel}
      </button>
    </div>
  )
}

/* -----------------------------------------------------------
   Section forms
   ----------------------------------------------------------- */

function ProfileForm({ profile, onChange }) {
  const set = (key, val) => onChange({ ...profile, [key]: val })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name *"><Input value={profile.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
      <Field label="Role / title"><Input value={profile.role ?? ''} onChange={(e) => set('role', e.target.value)} /></Field>
      <Field label="Email *"><Input type="email" value={profile.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
      <Field label="Phone"><Input value={profile.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field label="Location"><Input value={profile.location ?? ''} onChange={(e) => set('location', e.target.value)} /></Field>
      <Field label="Availability"><Input value={profile.availability ?? ''} onChange={(e) => set('availability', e.target.value)} placeholder="Available Summer 2027" /></Field>
      <Field label="GitHub URL"><Input value={profile.github ?? ''} onChange={(e) => set('github', e.target.value)} placeholder="https://github.com/..." /></Field>
      <Field label="LinkedIn URL"><Input value={profile.linkedin ?? ''} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://www.linkedin.com/in/..." /></Field>
      <Field label="Tagline" span={2}>
        <Input value={profile.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="I build games for the love of the game." />
      </Field>
      <Field label="Intro paragraph (hero)" span={2} hint="Appears under the tagline on the public site.">
        <Textarea rows={3} value={profile.intro ?? ''} onChange={(e) => set('intro', e.target.value)} />
      </Field>
    </div>
  )
}

function AboutForm({ about, onChange }) {
  const safeAbout = about || { paragraphs: [], interests: [] }
  const set = (key, val) => onChange({ ...safeAbout, [key]: val })
  return (
    <div className="space-y-4">
      <Field label="About paragraphs" hint="Each entry becomes a paragraph on the public site.">
        <div className="space-y-2">
          {(safeAbout.paragraphs || []).map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <Textarea
                rows={3}
                value={p}
                onChange={(e) => {
                  const next = [...safeAbout.paragraphs]
                  next[i] = e.target.value
                  set('paragraphs', next)
                }}
              />
              <button
                type="button"
                onClick={() => set('paragraphs', safeAbout.paragraphs.filter((_, j) => j !== i))}
                className="mt-1 rounded-md p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set('paragraphs', [...(safeAbout.paragraphs || []), ''])}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <Plus size={12} /> Add paragraph
          </button>
        </div>
      </Field>
      <Field label="Interests" hint="Short bullet items shown under the paragraphs.">
        <StringList
          values={safeAbout.interests}
          onChange={(v) => set('interests', v)}
          placeholder="Gameplay and mechanics design"
        />
      </Field>
    </div>
  )
}

function SkillsForm({ groups, onChange }) {
  return (
    <ItemList
      items={groups || []}
      onChange={onChange}
      addLabel="Add skill group"
      makeEmpty={() => ({ title: '', items: [] })}
      renderItem={(group, patch) => (
        <div className="space-y-3 pr-8">
          <Field label="Group title">
            <Input value={group.title ?? ''} onChange={(e) => patch({ title: e.target.value })} placeholder="Languages" />
          </Field>
          <Field label="Items">
            <StringList
              values={group.items}
              onChange={(v) => patch({ items: v })}
              placeholder="C#"
            />
          </Field>
        </div>
      )}
    />
  )
}

function ProjectsForm({ projects, onChange }) {
  return (
    <ItemList
      items={projects || []}
      onChange={onChange}
      addLabel="Add project"
      makeEmpty={() => ({
        title: '', role: '', year: '', description: '',
        impact: [], tech: [], githubUrl: '', demoUrl: '',
      })}
      renderItem={(project, patch) => (
        <div className="space-y-3 pr-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Title *" span={2}>
              <Input value={project.title ?? ''} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label="Year">
              <Input value={project.year ?? ''} onChange={(e) => patch({ year: e.target.value })} placeholder="2025" />
            </Field>
            <Field label="Role" span={3}>
              <Input value={project.role ?? ''} onChange={(e) => patch({ role: e.target.value })} placeholder="Collisions Manager" />
            </Field>
          </div>
          <Field label="Description">
            <Textarea rows={3} value={project.description ?? ''} onChange={(e) => patch({ description: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="GitHub URL">
              <Input value={project.githubUrl ?? ''} onChange={(e) => patch({ githubUrl: e.target.value })} placeholder="https://github.com/..." />
            </Field>
            <Field label="Demo URL">
              <Input value={project.demoUrl ?? ''} onChange={(e) => patch({ demoUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </div>
          <Field label="Tech stack">
            <StringList values={project.tech} onChange={(v) => patch({ tech: v })} placeholder="C#" />
          </Field>
          <Field label="Impact / bullets">
            <StringList values={project.impact} onChange={(v) => patch({ impact: v })} placeholder="What you owned and what it produced." />
          </Field>
        </div>
      )}
    />
  )
}

function ExperienceForm({ entries, onChange }) {
  return (
    <ItemList
      items={entries || []}
      onChange={onChange}
      addLabel="Add experience"
      makeEmpty={() => ({ role: '', company: '', location: '', period: '', points: [] })}
      renderItem={(entry, patch) => (
        <div className="space-y-3 pr-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role *">
              <Input value={entry.role ?? ''} onChange={(e) => patch({ role: e.target.value })} />
            </Field>
            <Field label="Company *">
              <Input value={entry.company ?? ''} onChange={(e) => patch({ company: e.target.value })} />
            </Field>
            <Field label="Location">
              <Input value={entry.location ?? ''} onChange={(e) => patch({ location: e.target.value })} placeholder="Rochester, NY" />
            </Field>
            <Field label="Period">
              <Input value={entry.period ?? ''} onChange={(e) => patch({ period: e.target.value })} placeholder="Summer 2024" />
            </Field>
          </div>
          <Field label="Bullets">
            <StringList values={entry.points} onChange={(v) => patch({ points: v })} placeholder="What you did and what it taught you." />
          </Field>
        </div>
      )}
    />
  )
}

function EducationForm({ education, onChange }) {
  const safeEdu = education || {
    school: '', college: '', degree: '', location: '', period: '', gpa: '', honors: [], coursework: [],
  }
  const set = (key, val) => onChange({ ...safeEdu, [key]: val })
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="School *"><Input value={safeEdu.school ?? ''} onChange={(e) => set('school', e.target.value)} /></Field>
        <Field label="College / department"><Input value={safeEdu.college ?? ''} onChange={(e) => set('college', e.target.value)} /></Field>
        <Field label="Degree *"><Input value={safeEdu.degree ?? ''} onChange={(e) => set('degree', e.target.value)} /></Field>
        <Field label="GPA"><Input value={safeEdu.gpa ?? ''} onChange={(e) => set('gpa', e.target.value)} placeholder="3.64" /></Field>
        <Field label="Location"><Input value={safeEdu.location ?? ''} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label="Period"><Input value={safeEdu.period ?? ''} onChange={(e) => set('period', e.target.value)} placeholder="2024 - Expected May 2028" /></Field>
      </div>
      <Field label="Honors">
        <StringList values={safeEdu.honors} onChange={(v) => set('honors', v)} placeholder="Presidential Scholarship" />
      </Field>
      <Field label="Relevant coursework">
        <StringList values={safeEdu.coursework} onChange={(v) => set('coursework', v)} placeholder="C#/C++ fundamentals" />
      </Field>
    </div>
  )
}

function PasswordForm({ currentPassword, onPasswordChanged }) {
  const [current, setCurrent] = useState(currentPassword ?? '')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const result = await api.changePassword(current, next)
      setMessage(result.passwordSet ? 'Password updated.' : 'Password removed — admin is now open.')
      setCurrent(next)
      setNext('')
      setConfirm('')
      // Critical: tell the parent so subsequent saves use the new password
      // instead of the now-invalidated original one.
      onPasswordChanged?.(next)
    } catch (err) {
      setError(err.message || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-stone-500 flex items-center gap-1.5">
        <KeyRound size={12} /> Leave the new fields blank to clear the password and put the admin back to open mode.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Current password">
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-secondary text-sm disabled:opacity-60">
          {submitting ? 'Saving…' : 'Update password'}
        </button>
        {message && <span className="text-xs text-emerald-700">{message}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </form>
  )
}

/* -----------------------------------------------------------
   Tiny utilities
   ----------------------------------------------------------- */

function deepClone(v) {
  return JSON.parse(JSON.stringify(v))
}

function setIn(obj, path, value) {
  if (path.length === 0) return value
  const [head, ...rest] = path
  return { ...obj, [head]: setIn(obj?.[head], rest, value) }
}
