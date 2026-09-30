import { Suspense } from 'react'
import type { ComponentType } from 'react'
import Landing from './Landing'
import type { RegisteredPresentation } from './presentations'

function PresentationRoute({ Component }: { Component: ComponentType }) {
  return <Suspense fallback={<main data-presentation-loading>Loading presentation…</main>}><Component /></Suspense>
}

export function Router({ pathname, presentations }: { pathname: string; presentations: readonly RegisteredPresentation[] }) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = presentations.find((presentation) => presentation.slug === slug)
  return entry ? <PresentationRoute Component={entry.Component} /> : <Landing />
}
