import { Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Landing } from './Landing'
import { resolveRoute, type PresentationComponents, type PresentationEntry } from './registry'

export interface RouterProps {
  pathname: string
  registry: readonly PresentationEntry[]
  components: PresentationComponents
}

/** Mounts a presentation component handed in as a prop. */
function Mounted({ Component }: { Component: LazyExoticComponent<ComponentType> }) {
  return <Component />
}

/** Renders Landing, or the matched presentation loaded lazily inside Suspense. */
export function Router({ pathname, registry, components }: RouterProps) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  const Component = components.get(route.entry.slug)!
  return (
    <Suspense fallback={<p role="status">Loading presentation…</p>}>
      <Mounted Component={Component} />
    </Suspense>
  )
}
