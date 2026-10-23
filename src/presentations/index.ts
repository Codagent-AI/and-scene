export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: React.ComponentType }>
}

/** Explicit registry: adding a presentation is a new folder plus one line here. */
export const presentations: readonly PresentationEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk.tsx'),
  },
]
