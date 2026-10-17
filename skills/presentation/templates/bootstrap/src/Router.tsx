import { Suspense, useMemo } from 'react'
import { Landing } from './Landing.tsx'
import { resolveRoute } from './router.ts'

export function Router({ pathname = window.location.pathname }: { pathname?: string }) {
  const route = useMemo(() => resolveRoute(pathname), [pathname])
  if (route.kind === 'landing') return <Landing />
  const Talk = route.Component
  return (
    <Suspense fallback={null}>
      <Talk />
    </Suspense>
  )
}
