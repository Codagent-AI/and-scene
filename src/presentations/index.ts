import type { ComponentType } from 'react'
export interface Registration { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: readonly Registration[] = [{
  slug: 'how-to-make-a-presentation',
  title: 'How to Use This Skill to Make a Presentation',
  load: () => import('./how-to-make-a-presentation/Talk'),
}]
