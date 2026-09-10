import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import type { ComponentType, LazyExoticComponent } from 'react'
import './index.css'
import Landing from './Landing'
import { presentations, resolvePresentation } from './presentations'

const components = new Map(presentations.map((presentation) => [presentation.slug, lazy(presentation.load)]))

function Loaded({ component: Component }: { component: LazyExoticComponent<ComponentType> }) {
  return <Component />
}

export function AppRouter() {
  const registration = resolvePresentation(window.location.pathname)
  const component = registration ? components.get(registration.slug) : undefined
  return component ? <Suspense fallback={<main data-presentation-loading>Loading presentation…</main>}><Loaded component={component} /></Suspense> : <Landing />
}

createRoot(document.getElementById('root')!).render(<StrictMode><AppRouter /></StrictMode>)
