import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'
import { routeSlug } from './routeSlug'

const slug = routeSlug(window.location.pathname)
const entry = slug ? presentations.find((presentation) => presentation.slug === slug) : undefined
const PresentationRoute = entry ? lazy(entry.load) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PresentationRoute ? <Suspense fallback={<main data-route-loading="true">Loading presentation…</main>}><PresentationRoute /></Suspense> : <Landing />}
  </StrictMode>,
)
