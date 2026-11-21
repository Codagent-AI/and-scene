import { Suspense } from 'react'
import Landing from './Landing'
import type { PresentationRoute } from './routes'

interface RouterProps {
  pathname: string
  routes: readonly PresentationRoute[]
}

export default function Router({ pathname, routes }: RouterProps) {
  const route = pathname.replace(/\/$/, '')
  const match = routes.find(({ slug }) => route === `/${slug}`)

  if (!match) return <Landing entries={routes} />

  const { Component } = match
  return (
    <Suspense fallback={<main className="route-loading">Loading presentation…</main>}>
      <Component />
    </Suspense>
  )
}
