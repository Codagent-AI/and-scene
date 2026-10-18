import { createElement, Suspense } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations'
import { findEntry, lazyFor } from './routes'

/** `/` and unknown paths show the Landing page; `/<slug>` lazy-loads that presentation. */
export function Router({ pathname, registry }: { pathname: string; registry: readonly PresentationEntry[] }) {
  const entry = findEntry(pathname, registry)
  if (!entry) return <Landing registry={registry} />
  return (
    <Suspense fallback={<p data-route-loading="">Loading…</p>}>
      {createElement(lazyFor(entry))}
    </Suspense>
  )
}
