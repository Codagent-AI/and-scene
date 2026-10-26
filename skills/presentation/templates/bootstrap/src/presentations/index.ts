import type { RegistryEntry } from '../routing'
export const presentations: RegistryEntry[] = [{ slug: 'example', title: 'Example presentation', load: () => import('./example/Talk') }]
