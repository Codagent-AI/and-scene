import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'
import { resolveRoute } from './presentation-kit/navigation'

export function resolvePage(pathname: string) {
  const slug = resolveRoute(pathname, presentations.map(({ slug: item }) => item))
  const entry = presentations.find((item) => item.slug === slug)
  return entry ? lazy(entry.load) : Landing
}

const Page = resolvePage(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div role="status">Loading presentation…</div>}><Page /></Suspense>
  </StrictMode>,
)
