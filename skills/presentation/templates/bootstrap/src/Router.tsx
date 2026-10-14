import { Suspense, createElement, lazy } from 'react'
import type { ComponentType } from 'react'
import { Landing } from './Landing'
import { presentations as defaultRegistry } from './presentations'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './route'

const lazyTalks = new WeakMap<PresentationEntry['load'], ComponentType>()

function lazyTalk(entry: PresentationEntry): ComponentType {
  let Talk = lazyTalks.get(entry.load)
  if (!Talk) lazyTalks.set(entry.load, (Talk = lazy(entry.load)))
  return Talk
}

function Routed({ entry }: { entry: PresentationEntry }) {
  return <Suspense fallback={null}>{createElement(lazyTalk(entry))}</Suspense>
}

export function Router({
  pathname = window.location.pathname,
  registry = defaultRegistry,
}: {
  pathname?: string
  registry?: readonly PresentationEntry[]
}) {
  const entry = resolveRoute(pathname, registry)
  return entry ? <Routed entry={entry} /> : <Landing presentations={registry} />
}
