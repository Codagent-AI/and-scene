import { presentationSlug } from '../presentation-route.mjs'
export const presentations = [
  { slug: 'example', title: 'Example', load: () => import('./example/Talk') },
].map(entry => ({ ...entry, slug: presentationSlug(entry.slug) }))
