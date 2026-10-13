import { createElement, lazy, Suspense } from 'react'
import { Landing } from './Landing'
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
  const entry = entries.find(item => pathname === `/${item.slug}`)
  return entry ? <Suspense fallback={<p role="status">Loading presentation…</p>}>{createElement(lazyEntry(entry))}</Suspense> : <Landing entries={entries} />
}
