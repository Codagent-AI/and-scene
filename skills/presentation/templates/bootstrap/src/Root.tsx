import { lazy, Suspense } from 'react'
import Landing from './Landing.tsx'
import { presentations } from './presentations/index.ts'
import { resolveRoute } from './router.ts'

const lazyPresentations = new Map(
  presentations.map((entry) => [entry.slug, lazy(entry.load)] as const),
)

function Root() {
  const route = resolveRoute(window.location.pathname, presentations)

  if (route.kind === 'landing') {
    return <Landing registry={presentations} />
  }

  const PresentationComponent = lazyPresentations.get(route.entry.slug)!
  return (
    <Suspense fallback={null}>
      {/* eslint-disable-next-line react-hooks/static-components -- module-scope
          lazyPresentations map is built once outside render; this only reads
          a stable reference, it does not create a new component per render. */}
      <PresentationComponent />
    </Suspense>
  )
}

export default Root
