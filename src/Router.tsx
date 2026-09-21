import React from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

export function Router() {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const entry = presentations.find((presentation) => presentation.slug === slug)
  if (!slug || !entry) return <Landing />
  return <LazyPresentation load={entry.load} />
}

function LazyPresentation({ load }: { load: () => Promise<{ default: React.ComponentType }> }) {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => {
    let active = true
    // Reset the view when the route's loader changes; this effect owns the loader lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFailed(false)
    setComponent(null)
    void Promise.resolve()
      .then(load)
      .then((module) => {
        if (active) setComponent(() => module.default)
      }, () => {
        if (active) setFailed(true)
      })
    return () => { active = false }
  }, [load])
  if (failed) {
    return (
      <main data-presentation-load-error>
        <p>Unable to load this presentation.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload</button>
      </main>
    )
  }
  return Component ? <Component /> : <p data-presentation-loading>Loading presentation…</p>
}
