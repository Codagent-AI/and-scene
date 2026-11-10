import { presentationSlug } from '../presentation-route.mjs'
export const presentations = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
].map(entry => ({ ...entry, slug: presentationSlug(entry.slug) }))
