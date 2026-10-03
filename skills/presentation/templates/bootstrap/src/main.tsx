import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { presentations } from './presentations/index.ts'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = presentations.find(presentation => presentation.slug === slug)
const Route = entry ? lazy(entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Route ? <Suspense fallback={<p>Loading presentation…</p>}><Route /></Suspense> : <Landing />}
  </StrictMode>,
)
