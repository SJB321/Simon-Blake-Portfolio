// Loads the resume data once at app startup and provides it (plus loading /
// error state and a refetch trigger) to all section components via context.
//
// Why context instead of prop-drilling? The data is consumed by ~8 components
// at varying depths. Context keeps each component's signature clean.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import type { ResumePayload } from '../types/resume'

interface ResumeDataContextValue {
  data: ResumePayload | null
  loading: boolean
  error: Error | null
  refetch: (opts?: { fresh?: boolean }) => Promise<void>
}

const ResumeDataContext = createContext<ResumeDataContextValue | null>(null)

export function ResumeDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ResumePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // `opts.fresh` forces a cache-busted fetch — used by the edit page after
  // a save so the UI shows the just-written content immediately rather than
  // a possibly-cached prior version.
  const load = useCallback(async (opts: { fresh?: boolean } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const payload = await api.getResume(opts)
      setData(payload)
    } catch (err) {
      console.error('[ResumeData] load failed:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ResumeDataContext.Provider value={{ data, loading, error, refetch: load }}>
      {children}
    </ResumeDataContext.Provider>
  )
}

/** Pull the resume data + status flags + refetch from context. */
export function useResumeData(): ResumeDataContextValue {
  const ctx = useContext(ResumeDataContext)
  if (!ctx) throw new Error('useResumeData must be used inside <ResumeDataProvider>')
  return ctx
}
