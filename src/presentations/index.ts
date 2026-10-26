import type { RegistryEntry } from '../routing'
export const presentations: RegistryEntry[] = [{ slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') }]
