import { Suspense } from 'react'
import type { ComponentType } from 'react'
import Landing from './Landing'
import type { RegisteredPresentation } from './presentations'

interface RouterProps {
  pathname: string
  presentations: readonly RegisteredPresentation[]
}

function PresentationRoute({ Component }: { Component: ComponentType }) {
  return (
    <Suspense fallback={<main data-presentation-loading>Loading presentation…</main>}>
      <Component />
    </Suspense>
  )
}

export function Router({ pathname, presentations }: RouterProps) {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  const entry = presentations.find((presentation) => presentation.slug === slug)
  if (!entry) return <Landing />
  return <PresentationRoute Component={entry.Component} />
}
