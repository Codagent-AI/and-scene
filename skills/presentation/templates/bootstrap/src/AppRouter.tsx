import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

function Loader({ load }: { load: () => Promise<{ default: ComponentType }> }) {
  const [Component, setComponent] = useState<ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void load().then(
      (module) => { if (active) setComponent(() => module.default) },
      (reason: unknown) => { if (active) setError(String(reason)) },
    )
    return () => { active = false }
  }, [load])
  if (error) return <main data-presentation-load-error><p>Unable to load this presentation: {error}</p><button type="button" onClick={() => window.location.reload()}>Reload</button></main>
  return Component ? <Component /> : <div data-presentation-loading>Loading presentation…</div>
}

export default function AppRouter() {
  const slug = window.location.pathname.replace(/^\//, '').replace(/\/$/, '')
  const entry = presentations.find((item) => item.slug === slug)
  return entry ? <Loader load={entry.load} /> : <Landing />
}
