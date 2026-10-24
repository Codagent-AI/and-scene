import { Suspense, createElement, lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './routes'

const talks = new WeakMap<PresentationEntry['load'], LazyExoticComponent<ComponentType>>()

/** One lazy component per registry loader, so re-renders never remount the presentation. */
function talkFor(entry: PresentationEntry) {
  let talk = talks.get(entry.load)
  if (!talk) {
    talk = lazy(entry.load)
    talks.set(entry.load, talk)
  }
  return talk
}

export function Router({ pathname, registry }: { pathname: string; registry: ReadonlyArray<PresentationEntry> }) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  return <Suspense fallback={null}>{createElement(talkFor(route.entry))}</Suspense>
}
