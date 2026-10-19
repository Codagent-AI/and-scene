import { lazy } from 'react'
import type { ComponentType } from 'react'
import type { PresentationEntry } from './presentations/registry'

export function resolveEntry(
  pathname: string,
  registry: readonly PresentationEntry[],
): PresentationEntry | undefined {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return slug ? registry.find((e) => e.slug === slug) : undefined
}

const pages = new WeakMap<PresentationEntry, ComponentType>()

/** One stable lazy component per registry entry, so re-renders never reset it. */
export function pageFor(entry: PresentationEntry): ComponentType {
  let page = pages.get(entry)
  if (!page) {
    page = lazy(entry.load)
    pages.set(entry, page)
  }
  return page
}
