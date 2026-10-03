import type { PresentationEntry } from './presentations'

export type RouteResolution = { kind: 'landing' } | { kind: 'presentation'; entry: PresentationEntry } | { kind: 'not-found'; slug: string }

function basePathFor(baseUrl: string): string {
  const path = baseUrl.startsWith('/') ? baseUrl : new URL(baseUrl, 'https://and-scene.invalid').pathname
  const segments = path.split('/').filter(Boolean)
  return `/${segments.join('/')}${segments.length ? '/' : ''}`
}

export function getBasePath(baseUrl: string): string { return basePathFor(baseUrl) }

export function resolveRoute(pathname: string, entries: readonly PresentationEntry[], baseUrl = '/'): RouteResolution {
  const basePath = basePathFor(baseUrl)
  if (pathname === basePath || pathname === basePath.slice(0, -1)) return { kind: 'landing' }
  if (!pathname.startsWith(basePath)) return { kind: 'not-found', slug: pathname }
  let slug: string
  try { slug = decodeURIComponent(pathname.slice(basePath.length).replace(/\/+$/, '')) }
  catch { return { kind: 'not-found', slug: pathname } }
  if (!slug || slug.includes('/')) return { kind: 'not-found', slug }
  const entry = entries.find(candidate => candidate.slug === slug)
  return entry ? { kind: 'presentation', entry } : { kind: 'not-found', slug }
}
