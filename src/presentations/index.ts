export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: React.ComponentType }>
}

/** Explicit registration keeps routes deterministic and easy to review. */
export const presentations: readonly PresentationEntry[] = []
