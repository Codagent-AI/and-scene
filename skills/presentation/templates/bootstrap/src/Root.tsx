import { Suspense, lazy } from 'react'
import Landing from './Landing.tsx'
import { presentations } from './presentations'
import { resolveRoute } from './router.ts'

const route = resolveRoute(window.location.pathname, presentations)
const Page = route.kind === 'presentation' ? lazy(route.entry.load) : Landing

export default function Root() {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}
