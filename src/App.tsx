import { Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Landing } from './Landing'
import { getPresentationComponent } from './presentationLoader'
import { presentations } from './presentations'
import { resolveRoute } from './router'

function renderRoute(pathname: string): ReactNode {
  const route = resolveRoute(pathname, presentations)
  if (route.type !== 'presentation') return <Landing />

  const PresentationComponent = getPresentationComponent(route.entry.slug)
  if (!PresentationComponent) return <Landing />

  return (
    <Suspense fallback={null}>
      <PresentationComponent />
    </Suspense>
  )
}

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return renderRoute(pathname)
}

export default App
