export interface PresentationEntry {
  slug: string
  title: string
  load: () => Promise<{ default: import('react').ComponentType }>
}

export const presentations: PresentationEntry[] = []
