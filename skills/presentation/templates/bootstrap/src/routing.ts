import { presentations } from './presentations'
export const resolveRoute = (pathname: string, entries = presentations) => entries.find(p => `/${p.slug}` === pathname.replace(/\/$/, ''))
