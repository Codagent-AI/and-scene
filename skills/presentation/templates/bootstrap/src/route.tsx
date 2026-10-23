import { lazy, Suspense, type ReactElement } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

/** Minimal pathname router: "/" and unknown paths show Landing; "/<slug>" lazy-loads that presentation. */
export function resolveRoute(pathname: string): ReactElement {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = presentations.find((candidate) => candidate.slug === slug)
  if (!entry) return <Landing />
  const Presentation = lazy(entry.load)
  return (
    <Suspense fallback={null}>
      <Presentation />
    </Suspense>
  )
}
