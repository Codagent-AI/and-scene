import { Suspense, createElement, lazy } from 'react'
import type { ReactElement } from 'react'
import Landing from './Landing.tsx'
import { presentations } from './presentations'
import { resolveRoute } from './router.ts'

const pages = new Map(presentations.map((entry) => [entry.slug, lazy(entry.load)]))

function pageFor(pathname: string): ReactElement {
  const route = resolveRoute(pathname)
  const page = route.kind === 'presentation' ? pages.get(route.entry.slug) : undefined
  return createElement(page ?? Landing)
}

/** Minimal pathname router: "/" lists presentations, "/<slug>" lazy-loads one. */
export function App({ pathname }: { pathname: string }) {
  return <Suspense fallback={null}>{pageFor(pathname)}</Suspense>
}
