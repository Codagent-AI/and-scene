import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { isValidRegistry, presentations } from './presentations'
import { resolveRoute } from './presentation-kit/navigation'
import { PageErrorBoundary } from './PageErrorBoundary'

if (!isValidRegistry(presentations)) {
  throw new Error('Invalid presentation registry: check slugs, titles, and duplicates')
}

export function resolvePage(pathname: string) {
  const slug = resolveRoute(pathname, presentations.map(({ slug: item }) => item))
  const entry = presentations.find((item) => item.slug === slug)
  return entry ? lazy(entry.load) : Landing
}

const Page = resolvePage(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PageErrorBoundary><Suspense fallback={<div role="status">Loading presentation…</div>}><Page /></Suspense></PageErrorBoundary>
  </StrictMode>,
)
