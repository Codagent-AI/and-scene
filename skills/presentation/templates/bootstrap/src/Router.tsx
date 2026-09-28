import { Suspense, lazy } from 'react'
import { Landing } from './Landing.tsx'
import { presentations } from './presentations/index.ts'

/** One lazy component per registered slug, created once at module scope. */
const routes = new Map(presentations.map((entry) => [entry.slug, lazy(entry.load)]))

function resolveSlug() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  return slug || null
}

/** Zero-dependency pathname router: "/" -> Landing, "/<slug>" -> the matching registry entry. */
export function Router() {
  const slug = resolveSlug()
  const LazyPresentation = slug ? routes.get(slug) : undefined

  if (!LazyPresentation) {
    return <Landing />
  }

  return (
    <Suspense fallback={<div data-presentation-loading="" />}>
      {/* eslint-disable-next-line react-hooks/static-components -- looked up from a module-scope Map, not created here */}
      <LazyPresentation />
    </Suspense>
  )
}
