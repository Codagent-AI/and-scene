import { Suspense, use } from 'react'
import type { ComponentType } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations'
import { presentationRegistry } from './presentations'
import { resolvePresentationRoute } from './router'

const presentationPages = new Map<PresentationEntry, Promise<{ default: ComponentType }>>()

function presentationModule(entry: PresentationEntry) {
  const existing = presentationPages.get(entry)
  if (existing) return existing
  const page = entry.load()
  presentationPages.set(entry, page)
  return page
}

function RegisteredPresentation({ entry }: { entry: PresentationEntry }) {
  const PresentationPage = use(presentationModule(entry)).default
  return <PresentationPage />
}

export function AppRouter() {
  const route = resolvePresentationRoute(window.location.pathname, presentationRegistry)
  if (route.kind === 'landing') return <Landing />

  return <Suspense fallback={<p>Loading presentation…</p>}><RegisteredPresentation entry={route.entry} /></Suspense>
}
