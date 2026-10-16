import { createElement, lazy, Suspense, type ReactNode } from 'react'
import Landing from './Landing.tsx'
import { PRESENTATIONS } from './presentations'

const PAGES = new Map(PRESENTATIONS.map((p) => [p.slug, lazy(p.load)]))

/**
 * Minimal pathname router: "/<slug>" → that presentation; anything else → `fallback`
 * (an existing host app) or the presentation Landing page.
 */
export default function Router({ fallback }: { fallback?: ReactNode }) {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const Page = PAGES.get(slug)
  if (!Page) return fallback ?? <Landing />
  return <Suspense fallback={null}>{createElement(Page)}</Suspense>
}
