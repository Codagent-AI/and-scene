export const presentations = [{ slug: 'example', title: 'Example presentation', load: () => import('./example/Talk') }]
export function findPresentation(pathname: string) {
  return presentations.find(entry => `/${entry.slug}` === pathname.replace(/\/$/, ''))
}
