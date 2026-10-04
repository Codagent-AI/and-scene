import { StrictMode, Suspense, createElement, lazy, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'

const subscribeToPath = (callback: () => void) => {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

const getPath = () => window.location.pathname
const NotFound = () => <main className="route-not-found"><h1>Presentation not found</h1><a href="/">Back to presentations</a></main>
const routeComponents = new Map(presentations.map((registration) => [registration.slug, lazy(registration.load)]))

function RouteContent({ slug }: { slug: string }) {
  const RoutedPresentation = routeComponents.get(slug)
  if (!RoutedPresentation) return <NotFound />
  return <Suspense fallback={<main className="route-loading" aria-live="polite">Loading presentation…</main>}>
    {createElement(RoutedPresentation)}
  </Suspense>
}

export default function App() {
  const path = useSyncExternalStore(subscribeToPath, getPath, () => '/')
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return <Landing />
  if (segments.length !== 1) return <NotFound />
  return <RouteContent key={segments[0]} slug={segments[0]} />
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
