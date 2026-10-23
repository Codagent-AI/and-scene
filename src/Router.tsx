import { createElement, Suspense } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations/types'
import { componentFor, resolveRoute } from './routes'

export function Router({ pathname, registry }: { pathname: string; registry: readonly PresentationEntry[] }) {
  const entry = resolveRoute(pathname, registry)
  if (!entry) return <Landing registry={registry} />
  return <Suspense fallback={null}>{createElement(componentFor(entry))}</Suspense>
}
