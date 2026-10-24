import { Suspense, createElement } from 'react'
import { Landing } from './Landing.tsx'
import { lazyPresentation } from './lazyPresentation.ts'
import type { PresentationEntry } from './presentations/index.ts'
import { resolveRoute } from './router.ts'

export function AppRouter({ pathname, registry }: { pathname: string; registry: readonly PresentationEntry[] }) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  return (
    <Suspense fallback={null}>
      {createElement(lazyPresentation(route.entry))}
    </Suspense>
  )
}
