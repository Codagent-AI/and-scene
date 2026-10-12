import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Landing } from './Landing'
import { presentations } from './presentations'
import './index.css'
const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = presentations.find((item) => item.slug === slug)
function App() {
  if (!entry) return <Landing />
  const Talk = React.lazy(entry.load)
  return <Suspense fallback={<p>Loading presentation…</p>}><Talk /></Suspense>
}
createRoot(document.getElementById('root')!).render(<App />)
