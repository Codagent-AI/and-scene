import { createElement, lazy, Suspense } from 'react'
import { Landing } from './Landing'
import { PresentationErrorBoundary } from './PresentationErrorBoundary'
import { presentations } from './presentations'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { PresentationEntry } from './presentations'

const loaded = new WeakMap<PresentationEntry, LazyExoticComponent<ComponentType>>()
function lazyEntry(entry: PresentationEntry) {
  let component = loaded.get(entry)
  if (!component) { component = lazy(entry.load); loaded.set(entry, component) }
  return component
}

export function Host({ pathname = window.location.pathname, entries = presentations }: {
  pathname?: string; entries?: readonly PresentationEntry[]
}) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const entry = entries.find(item => path === `/${item.slug}`)
  return entry ? <PresentationErrorBoundary key={entry.slug} title={entry.title}>
    <Suspense fallback={<p role="status">Loading presentation…</p>}>{createElement(lazyEntry(entry))}</Suspense>
  </PresentationErrorBoundary> : <Landing entries={entries} />
}
