import { Suspense, lazy } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
import { resolveRoute } from './route'

// Lazy wrappers are created once per slug so re-renders never remount a presentation.
const pages = new Map(presentations.map((p) => [p.slug, lazy(p.load)]))

/** Minimal pathname router: "/" and unknown paths show the landing page. */
export default function Router({ pathname }: { pathname: string }) {
  const entry = resolveRoute(pathname)
  const Page = entry ? pages.get(entry.slug) : undefined
  return <Suspense fallback={null}>{Page ? <Page /> : <Landing />}</Suspense>
}
