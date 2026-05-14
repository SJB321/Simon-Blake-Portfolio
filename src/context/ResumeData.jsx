// Loads the resume data once at app startup and provides it (plus loading /
// error state and a refetch trigger) to all section components via context.
//
// Why context instead of prop-drilling? The data is consumed by ~8 components
// at varying depths. Context keeps each component's signature clean.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const ResumeDataContext = createContext(null)

export function ResumeDataProvider({ children }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // `opts.fresh` forces a cache-busted fetch — used by the edit page after
  // a save so the UI shows the just-written content immediately rather than
  // a possibly-cached prior version.
  const load = useCallback(async (opts = {}) => {
    setLoading(true)
    setError(null)
    try {
      const payload = await api.getResume(opts)
      setData(payload)
    } catch (err) {
      console.error('[ResumeData] load failed:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <ResumeDataContext.Provider value={{ data, loading, error, refetch: load }}>
      {children}
    </ResumeDataContext.Provider>
  )
}

/** Pull the resume data + status flags + refetch from context. */
export function useResumeData() {
  const ctx = useContext(ResumeDataContext)
  if (!ctx) throw new Error('useResumeData must be used inside <ResumeDataProvider>')
  return ctx
}
