import { lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { PRESENTATIONS, type PresentationEntry } from './presentations'
import { resolveRoute } from './route'

const lazyEntries = new WeakMap<PresentationEntry, ReturnType<typeof lazy>>()

function lazyFor(entry: PresentationEntry) {
  let component = lazyEntries.get(entry)
  if (!component) {
    component = lazy(entry.load)
    lazyEntries.set(entry, component)
  }
  return component
}

export interface RouterProps {
  pathname?: string
  registry?: readonly PresentationEntry[]
}

export function Router({
  pathname = window.location.pathname,
  registry = PRESENTATIONS,
}: RouterProps) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  const Presentation = lazyFor(route.entry)
  return (
    <Suspense fallback={null}>
      <Presentation />
    </Suspense>
  )
}
