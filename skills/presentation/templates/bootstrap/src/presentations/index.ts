export const presentations = [{ slug: 'starter', title: 'Starter', load: () => import('./starter/Talk') }]
export function resolvePresentation(path: string) { return presentations.find(p => path === `/${p.slug}` || path === `/${p.slug}/`) }
