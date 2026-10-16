import { createElement, lazy, Suspense } from 'react'
import Landing from './Landing.tsx'
import { PRESENTATIONS } from './presentations'

const PAGES = new Map(PRESENTATIONS.map((p) => [p.slug, lazy(p.load)]))

/** Minimal pathname router: "/" and unknown paths → Landing, "/<slug>" → that presentation. */
export default function Router() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const Page = PAGES.get(slug)
  if (!Page) return <Landing />
  return <Suspense fallback={null}>{createElement(Page)}</Suspense>
}
