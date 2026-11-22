import { presentations } from './presentations'
export function resolveRoute(path: string) { return presentations.find(entry => `/${entry.slug}` === path.replace(/\/$/, '')) }
