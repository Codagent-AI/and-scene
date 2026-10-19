import { Suspense, lazy } from 'react'
import Landing from './Landing.tsx'
import { presentations } from './presentations'
import { resolveRoute } from './route.ts'

const route = resolveRoute(window.location.pathname, presentations)
const Talk = route.kind === 'presentation' ? lazy(route.entry.load) : null

export default function Root() {
  if (!Talk) return <Landing presentations={presentations} />
  return (
    <Suspense fallback={null}>
      <Talk />
    </Suspense>
  )
}
