// App root: providers + routes.

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ResumeDataProvider } from './context/ResumeData'
import PublicResume from './pages/PublicResume'

// /edit is code-split so the public site (which most visitors land on) doesn't
// pay the cost of the edit page bundle — form components, theme editor, image
// manager, etc. The chunk loads on first navigation to /edit, then cached.
const router = createBrowserRouter([
  { path: '/', element: <PublicResume /> },
  {
    path: '/edit',
    lazy: async () => {
      const mod = await import('./pages/EditResume')
      return { Component: mod.default }
    },
  },
])

export default function App() {
  return (
    <ResumeDataProvider>
      <RouterProvider router={router} />
    </ResumeDataProvider>
  )
}
