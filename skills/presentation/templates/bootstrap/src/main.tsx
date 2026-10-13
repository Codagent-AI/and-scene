import { createElement, StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Landing } from './Landing'
import { presentationForPath, presentations } from './presentations'
const pages = new Map(presentations.map(entry => [entry.slug, lazy(entry.load)]))
function Router() {
  const entry = presentationForPath(window.location.pathname)
  if (!entry) return <Landing />
  const Page = pages.get(entry.slug)
  return Page ? createElement(Suspense, { fallback: <main aria-busy="true">Loading…</main> }, createElement(Page)) : <Landing />
}
createRoot(document.getElementById('root')!).render(<StrictMode><Router /></StrictMode>)
