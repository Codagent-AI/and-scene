import type { ComponentType } from 'react'

export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

// Explicit registry: add a presentation = new folder + one line here.
export const presentations: PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
]

// Test-only: the screenshot-helper fixture is included solely in fixture builds.
if (import.meta.env.VITE_INSPECT_FIXTURE === '1') {
  presentations.push({
    slug: 'inspect-fixture',
    title: 'Inspect fixture (test only)',
    load: () => import('../test-fixtures/inspect-fixture/Fixture'),
  })
}
