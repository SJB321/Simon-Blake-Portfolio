// App root: providers + routes.

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ResumeDataProvider } from './context/ResumeData'
import PublicResume from './pages/PublicResume'
import EditResume from './pages/EditResume'

const router = createBrowserRouter([
  { path: '/', element: <PublicResume /> },
  { path: '/edit', element: <EditResume /> },
])

export default function App() {
  return (
    <ResumeDataProvider>
      <RouterProvider router={router} />
    </ResumeDataProvider>
  )
}
