import { lazy, Suspense } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
const entry = presentations.find((presentation) => presentation.slug === slug)
const RoutedPresentation = entry ? lazy(entry.load) : null

export default function AppRouter() {
  if (!RoutedPresentation) return <Landing />
  return <Suspense fallback={<main aria-live="polite">Loading presentation…</main>}><RoutedPresentation /></Suspense>
}
