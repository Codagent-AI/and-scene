import { presentations } from './presentations'
export function routeFor(path: string) { return presentations.find(p => path === `/${p.slug}` || path === `/${p.slug}/`) }
