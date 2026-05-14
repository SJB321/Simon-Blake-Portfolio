// App root: providers + routes.

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ResumeDataProvider } from './context/ResumeData.jsx'
import PublicResume from './pages/PublicResume.jsx'
import EditResume from './pages/EditResume.jsx'

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
