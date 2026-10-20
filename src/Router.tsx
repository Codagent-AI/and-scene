import { createElement, Suspense } from 'react'
import { Landing } from './Landing.tsx'
import { lazyEntry } from './lazyEntry.ts'
import type { PresentationEntry } from './presentations/index.ts'
import { resolveRoute } from './routing.ts'

export function Router({
  pathname,
  presentations,
}: {
  pathname: string
  presentations: readonly PresentationEntry[]
}) {
  const route = resolveRoute(pathname, presentations)
  if (route.kind === 'landing') return <Landing presentations={presentations} />
  return <Suspense fallback={null}>{createElement(lazyEntry(route.entry))}</Suspense>
}
