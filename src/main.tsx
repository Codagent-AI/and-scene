import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations } from './presentations'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const registration = presentations.find((item) => item.slug === slug)
const RoutedPresentation = registration ? lazy(registration.load) : null

export default function App() {
  if (!RoutedPresentation) return <Landing />
  return <Suspense fallback={<main className="route-loading" aria-live="polite">Loading presentation…</main>}><RoutedPresentation /></Suspense>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
