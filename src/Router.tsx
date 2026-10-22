import { Suspense, createElement } from 'react'
import { Landing } from './Landing.tsx'
import { lazyPresentation } from './presentations/lazyPresentation.ts'
import { resolveRoute } from './presentations/registry.ts'
import type { PresentationEntry } from './presentations/registry.ts'

function LazyPresentation({ entry }: { entry: PresentationEntry }) {
  return (
    <Suspense fallback={<p data-route-loading="">Loading…</p>}>
      {createElement(lazyPresentation(entry))}
    </Suspense>
  )
}

/** Minimal pathname router: `/` and unknown paths show Landing, `/<slug>` lazy-loads that presentation. */
export function Router({ pathname, registry }: { pathname: string; registry: readonly PresentationEntry[] }) {
  const route = resolveRoute(pathname, registry)
  return route.kind === 'landing' ? <Landing registry={registry} /> : <LazyPresentation entry={route.entry} />
}
