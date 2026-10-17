import { createElement, Suspense, use } from 'react'
import { Landing } from './Landing'
import { PRESENTATIONS, type PresentationEntry } from './presentations'
import { resolveRoute } from './route'

const loads = new WeakMap<PresentationEntry, ReturnType<PresentationEntry['load']>>()

function loadOnce(entry: PresentationEntry) {
  let load = loads.get(entry)
  if (!load) {
    load = entry.load()
    loads.set(entry, load)
  }
  return load
}

function Loaded({ entry }: { entry: PresentationEntry }) {
  return createElement(use(loadOnce(entry)).default)
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
  return (
    <Suspense fallback={null}>
      <Loaded entry={route.entry} />
    </Suspense>
  )
}
