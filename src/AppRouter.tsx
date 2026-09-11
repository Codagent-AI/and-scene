import { lazy, Suspense } from 'react'
import { Landing } from './Landing.tsx'
import { PRESENTATIONS } from './presentations/index.ts'
import { resolvePresentation } from './router.ts'

const route = resolvePresentation(window.location.pathname, PRESENTATIONS)
const RoutedPresentation = route === 'landing' ? null : lazy(route.load)

export function AppRouter() {
  if (route === 'landing' || !RoutedPresentation) return <Landing />
  return (
    <Suspense fallback={<main data-route-loading>Loading presentation…</main>}>
      <RoutedPresentation />
    </Suspense>
  )
}
