import { useEffect, useState, type ComponentType } from 'react'
import Landing from './Landing'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './resolveRoute'

/** Loads a registered presentation's module on demand. */
function LoadedPresentation({ entry }: { entry: PresentationEntry }) {
  const [loaded, setLoaded] = useState<{ slug: string; View: ComponentType } | null>(null)
  useEffect(() => {
    let live = true
    void entry.load().then((m) => {
      if (live) setLoaded({ slug: entry.slug, View: m.default })
    })
    return () => {
      live = false
    }
  }, [entry])
  if (!loaded || loaded.slug !== entry.slug) return null
  const { View } = loaded
  return <View />
}

export function Router({
  pathname,
  registry,
}: {
  pathname: string
  registry: readonly PresentationEntry[]
}) {
  const route = resolveRoute(pathname, registry)
  if (route.kind === 'landing') return <Landing registry={registry} />
  return <LoadedPresentation entry={route.entry} />
}
