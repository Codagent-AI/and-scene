import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.tsx'
import { presentations } from './presentations'
import { resolveRoute } from './router'

const route = resolveRoute(window.location.pathname, presentations)
const entry = route.type === 'presentation' ? presentations.find((candidate) => candidate.slug === route.slug) : undefined
const LazyPresentation = entry ? lazy(entry.load) : null

const content = LazyPresentation ? (
  <Suspense fallback={null}>
    <LazyPresentation />
  </Suspense>
) : (
  <Landing />
)

createRoot(document.getElementById('root')!).render(<StrictMode>{content}</StrictMode>)
