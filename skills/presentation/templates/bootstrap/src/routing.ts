import { presentations } from './presentations'
export function resolveRoute(pathname: string) { return presentations.find(p => `/${p.slug}` === pathname.replace(/\/$/, '')) }
