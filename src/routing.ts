import type { RegistryEntry } from './presentation-kit/types'
export function resolvePresentation(path: string, registry: readonly RegistryEntry[]) { return registry.find(entry => `/${entry.slug}` === path.replace(/\/$/, '')) }
