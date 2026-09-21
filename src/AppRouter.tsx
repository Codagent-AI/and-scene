import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import Landing from './Landing'
import { presentations } from './presentations'

function PresentationLoader({ load }: { load: () => Promise<{ default: ComponentType }> }) {
  const [Component, setComponent] = useState<ComponentType | null>(null)
  useEffect(() => { void load().then((module) => setComponent(() => module.default)) }, [load])
  return Component ? <Component /> : <div data-presentation-loading>Loading presentation…</div>
}

export default function AppRouter() {
  const slug = window.location.pathname.replace(/^\//, '').replace(/\/$/, '')
  const presentation = presentations.find((entry) => entry.slug === slug)
  return presentation ? <PresentationLoader load={presentation.load} /> : <Landing />
}
