import { Suspense, lazy } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
import { resolveRoute } from './route'

const route = resolveRoute(window.location.pathname, presentations)
const Page = route.kind === 'presentation' ? lazy(route.entry.load) : Landing

export default function Router() {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}
