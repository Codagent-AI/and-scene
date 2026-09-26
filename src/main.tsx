import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Landing } from './Landing.js'
import { presentations } from './presentations/index.js'

const slug = window.location.pathname.split('/').filter(Boolean)[0]
const entry = presentations.find(item => item.slug === slug)
const RoutedPresentation = entry ? lazy(entry.load) : null

export function AppRouter() {
  if (!slug || !RoutedPresentation) return <Landing />
  return <Suspense fallback={<main data-presentation-loading="">Loading presentation…</main>}><RoutedPresentation /></Suspense>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
