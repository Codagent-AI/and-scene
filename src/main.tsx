import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { lazy, Suspense } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import Landing from './Landing.tsx'
import { presentations, resolvePresentation } from './presentations'

const presentationComponents = new Map(
  presentations.map((presentation) => [presentation.slug, lazy(presentation.load)]),
)

function LoadedPresentation({ component: Component }: { component: LazyExoticComponent<ComponentType> }) {
  return <Component />
}

export function AppRouter() {
  const presentation = resolvePresentation(window.location.pathname)
  const Talk = presentation ? presentationComponents.get(presentation.slug) : undefined
  if (!Talk) return <Landing />
  return <Suspense fallback={<main data-presentation-loading>Loading presentation…</main>}><LoadedPresentation component={Talk} /></Suspense>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
