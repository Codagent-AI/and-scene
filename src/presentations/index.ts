export type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: React.ComponentType }> }
export const presentations: PresentationEntry[] = []
