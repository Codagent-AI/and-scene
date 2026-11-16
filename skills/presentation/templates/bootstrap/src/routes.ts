import { lazy } from 'react'
import { presentations } from './presentations'
const routes = presentations.map(p => ({ ...p, Component: lazy(p.load) }))
export function resolveRoute(path: string) { return routes.find(p => path === `/${p.slug}` || path === `/${p.slug}/`) }
