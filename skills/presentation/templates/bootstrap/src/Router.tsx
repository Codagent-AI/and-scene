import { createElement, lazy, Suspense } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import { Landing } from './Landing'
import { presentations } from './presentations'
import type { RegistryEntry } from './presentations'
const routes = new WeakMap<RegistryEntry['load'], LazyExoticComponent<ComponentType>>()
function resolve(load: RegistryEntry['load']) {
 let component = routes.get(load)
 if (!component) { component = lazy(load); routes.set(load, component) }
 return component
}
export function Router({ path = window.location.pathname, entries = presentations }: { path?: string; entries?: readonly RegistryEntry[] }) {
 const entry = entries.find(p => `/${p.slug}` === path)
 if (!entry) return <Landing entries={entries} />
 return <Suspense fallback={<p role="status">Loading presentation…</p>}>{createElement(resolve(entry.load))}</Suspense>
}
