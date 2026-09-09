import type { PresentationRegistration } from '../presentation-kit'

export const presentations: readonly PresentationRegistration[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]
