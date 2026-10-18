import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import Landing from './Landing'
import { presentations, type PresentationEntry } from './presentations'
import { resolveEntry } from './route'

interface AppRouterProps {
  pathname?: string
  registry?: readonly PresentationEntry[]
}

const loaded = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()

function lazyTalk(entry: PresentationEntry): LazyExoticComponent<ComponentType> {
  let Talk = loaded.get(entry)
  if (!Talk) loaded.set(entry, (Talk = lazy(entry.load)))
  return Talk
}

/** Minimal pathname router: "/<slug>" lazy-loads that presentation, anything else shows Landing. */
export default function AppRouter({
  pathname = window.location.pathname,
  registry = presentations,
}: AppRouterProps) {
  const entry = resolveEntry(pathname, registry)
  if (!entry) return <Landing registry={registry} />
  // lazyTalk returns a component cached per registry entry, so it is stable across renders.
  const Talk = lazyTalk(entry)
  return (
    <Suspense fallback={null}>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Talk />
    </Suspense>
  )
}
