import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

function Loader({ load }: { load: () => Promise<{ default: ComponentType }> }) {
  const [Component, setComponent] = useState<ComponentType | null>(null)
  useEffect(() => { void load().then((module) => setComponent(() => module.default)) }, [load])
  return Component ? <Component /> : <div data-presentation-loading>Loading presentation…</div>
}

export default function AppRouter() {
  const slug = window.location.pathname.replace(/^\//, '').replace(/\/$/, '')
  const entry = presentations.find((item) => item.slug === slug)
  return entry ? <Loader load={entry.load} /> : <Landing />
}
