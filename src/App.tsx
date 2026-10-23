import { createElement, lazy, Suspense, useMemo } from 'react'
import Landing from './Landing'
import { presentations, type PresentationEntry } from './presentations'
import { resolveRoute } from './route'

const lazyCache = new WeakMap<PresentationEntry, ReturnType<typeof lazy>>()
const lazyFor = (entry: PresentationEntry) => {
  let component = lazyCache.get(entry)
  if (!component) lazyCache.set(entry, (component = lazy(entry.load)))
  return component
}

export default function App({
  pathname = window.location.pathname,
  registry = presentations,
}: {
  pathname?: string
  registry?: readonly PresentationEntry[]
}) {
  const route = useMemo(() => resolveRoute(pathname, registry), [pathname, registry])
  if (route.kind === 'landing') return <Landing registry={registry} />
  return <Suspense fallback={null}>{createElement(lazyFor(route.entry))}</Suspense>
}
