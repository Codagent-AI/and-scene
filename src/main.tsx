import { createElement, StrictMode } from 'react'
import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Landing } from './Landing'
import { presentationForPath, presentations } from './presentations'

const presentationPages = new Map(presentations.map(entry => [entry.slug, lazy(entry.load)]))

export function Router() {
  const entry = presentationForPath(window.location.pathname)
  if (!entry) return <Landing />
  const Page = presentationPages.get(entry.slug)
  if (!Page) return <Landing />
  return createElement(Suspense, { fallback: <main aria-busy="true">Loading presentation…</main> }, createElement(Page))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
