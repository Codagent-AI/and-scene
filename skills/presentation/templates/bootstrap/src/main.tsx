import { createElement, StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing'
import { presentations, resolvePresentation } from './presentations'

const pages = new Map(presentations.map((registration) => [registration.slug, lazy(registration.load)]))

export function Router() {
  const slug = window.location.pathname.split('/').filter(Boolean)[0]
  const registration = slug ? resolvePresentation(slug) : undefined
  if (!registration) return <Landing />
  const Page = pages.get(registration.slug)
  return Page ? <Suspense fallback={<p>Loading presentation…</p>}>{createElement(Page)}</Suspense> : <Landing />
}

createRoot(document.getElementById('root')!).render(<StrictMode><Router /></StrictMode>)
