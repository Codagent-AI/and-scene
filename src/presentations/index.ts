export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: React.ComponentType }>
}

/** Explicit registry: one line per presentation, in the order Landing lists them. */
export const PRESENTATIONS: PresentationEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk.tsx') },
]
