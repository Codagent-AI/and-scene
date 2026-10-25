import { Suspense, use } from 'react'
import Landing from './Landing.tsx'
import type { PresentationEntry } from './presentations/index.ts'
import { resolveRoute } from './route.ts'

const loads = new Map<string, ReturnType<PresentationEntry['load']>>()

function load(entry: PresentationEntry) {
  let promise = loads.get(entry.slug)
  if (!promise) {
    promise = entry.load()
    loads.set(entry.slug, promise)
  }
  return promise
}

function Loaded({ entry }: { entry: PresentationEntry }) {
  const { default: Talk } = use(load(entry))
  return <Talk />
}

export default function App({ pathname }: { pathname: string }) {
  const route = resolveRoute(pathname)
  if (route.kind === 'landing') return <Landing />
  return (
    <Suspense fallback={null}>
      <Loaded entry={route.entry} />
    </Suspense>
  )
}
