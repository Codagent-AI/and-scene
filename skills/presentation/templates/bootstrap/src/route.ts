import { findPresentation, type PresentationEntry } from './presentations/index.ts'

export type Route = { kind: 'landing' } | { kind: 'presentation'; entry: PresentationEntry }

/** "/" and unknown paths show the landing page; "/<slug>" shows that presentation. */
export function resolveRoute(pathname: string): Route {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = slug ? findPresentation(slug) : undefined
  return entry ? { kind: 'presentation', entry } : { kind: 'landing' }
}
