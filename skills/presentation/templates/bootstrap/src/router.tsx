import { useEffect, useState, type ComponentType } from 'react'
import Landing from './Landing'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './resolveRoute'

/** Loads a registered presentation's module on demand. */
function LoadedPresentation({ entry }: { entry: PresentationEntry }) {
  const [loaded, setLoaded] = useState<{ slug: string; View: ComponentType } | null>(null)
  const [failedSlug, setFailedSlug] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    void Promise.resolve()
      .then(() => entry.load())
      .then((m) => {
        if (live) setLoaded({ slug: entry.slug, View: m.default })
      })
      .catch(() => {
        if (live) setFailedSlug(entry.slug)
      })
    return () => {
      live = false
    }
  }, [entry])
  if (failedSlug === entry.slug) {
    return (
      <p role="alert">
        Unable to load presentation. <a href="">Reload</a>
      </p>
    )
  }
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
