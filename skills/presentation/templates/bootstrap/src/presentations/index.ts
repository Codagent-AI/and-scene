export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: React.ComponentType }>
}

/** Explicit registry: one line per presentation, in the order Landing lists them. */
export const PRESENTATIONS: PresentationEntry[] = [
  { slug: 'starter', title: 'Starter presentation', load: () => import('./starter/Talk.tsx') },
]
