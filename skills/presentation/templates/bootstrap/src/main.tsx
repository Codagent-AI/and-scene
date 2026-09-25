import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { PRESENTATIONS } from './presentations'
import Landing from './Landing'
import './index.css'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const presentation = PRESENTATIONS.find((entry) => entry.slug === slug)
const Route = presentation ? lazy(presentation.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {Route ? <Suspense fallback={<div>Loading presentation…</div>}><Route /></Suspense> : <Landing />}
  </StrictMode>,
)
