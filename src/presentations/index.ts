import type { ComponentType } from 'react'
export type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
export const presentations: PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') },
  { slug: 'scene-kit-fixture', title: 'Scene kit fixture', load: () => import('./scene-kit-fixture/Fixture') },
]
export function isValidRegistry(entries: readonly PresentationEntry[]): boolean {
  return entries.every((entry) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) && Boolean(entry.title.trim()) && typeof entry.load === 'function') && new Set(entries.map((entry) => entry.slug)).size === entries.length
}
