export const presentations = [{ slug: 'example', title: 'Example', load: () => import('./example/Talk') }]
export function resolvePresentation(path: string) { return presentations.find(p => `/${p.slug}` === path.replace(/\/$/, '')) }
