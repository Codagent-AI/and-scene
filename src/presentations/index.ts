import type { PresentationEntry } from './types.ts'

// Explicit registry: one line per presentation, in review-friendly order.
export const presentations: PresentationEntry[] = [
  // presentations:begin
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk.tsx'),
  },
  // presentations:end
]
