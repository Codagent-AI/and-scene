export interface PresentationRegistration {
  slug: string
  title: string
  load: () => Promise<{ default: React.ComponentType }>
}

export const presentations: PresentationRegistration[] = []
