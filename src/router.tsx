import { Suspense, createElement, lazy, type ComponentType } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './routes'

const pages = new WeakMap<PresentationEntry, ComponentType>()

function pageFor(entry: PresentationEntry): ComponentType {
  let page = pages.get(entry)
  if (!page) {
    page = lazy(entry.load)
    pages.set(entry, page)
  }
  return page
}

export function Router({
  pathname,
  registry,
}: {
  pathname: string
  registry: readonly PresentationEntry[]
}) {
  const entry = resolveRoute(pathname, registry)
  if (!entry) return <Landing registry={registry} />
  return <Suspense fallback={null}>{createElement(pageFor(entry))}</Suspense>
}
