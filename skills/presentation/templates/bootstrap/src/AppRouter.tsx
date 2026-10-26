import { Suspense, use } from 'react'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations'
import { presentationRegistry } from './presentations'
import { loadPresentationModule } from './presentationLoader'
import { resolvePresentationRoute } from './router'

function RegisteredPresentation({ entry }: { entry: PresentationEntry }) {
  const Page = use(loadPresentationModule(entry)).default
  return <Page />
}

export function AppRouter() {
  const route = resolvePresentationRoute(window.location.pathname, presentationRegistry)
  return route.kind === 'landing'
    ? <Landing />
    : <Suspense fallback={<p>Loading presentation…</p>}><RegisteredPresentation entry={route.entry} /></Suspense>
}
