import React from 'react'
import Landing from './Landing'
import { presentations } from './presentations'
export function Router() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const entry = presentations.find((item) => item.slug === slug)
  if (!slug || !entry) return <Landing />
  return <LazyPresentation load={entry.load} />
}
function LazyPresentation({ load }: { load: () => Promise<{ default: React.ComponentType }> }) {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  React.useEffect(() => {
    let active = true
    void load()
      .then((module) => { if (active) setComponent(() => module.default) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause : new Error(String(cause))) })
    return () => { active = false }
  }, [load])
  if (error) return <p role="alert">Unable to load presentation. <button type="button" onClick={() => window.location.reload()}>Retry</button></p>
  return Component ? <Component /> : <p data-presentation-loading>Loading presentation…</p>
}
