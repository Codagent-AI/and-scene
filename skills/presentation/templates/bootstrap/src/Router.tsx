import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations/types'
import { resolveRoute } from './router'

/**
 * Builds the app router for a registry. Lazy components are created once, up front,
 * so a presentation's code loads on first visit and is reused afterwards.
 */
export function createRouter(registry: readonly PresentationEntry[]): ComponentType<{ pathname: string }> {
  const lazies = new Map<PresentationEntry, ComponentType>(
    registry.map((entry) => [entry, lazy(entry.load)]),
  )

  return function Router({ pathname }) {
    const route = resolveRoute(pathname, registry)
    if (route.kind === 'landing') return <Landing registry={registry} />
    const Presentation = lazies.get(route.entry)!
    return (
      <Suspense fallback={null}>
        <Presentation />
      </Suspense>
    )
  }
}
