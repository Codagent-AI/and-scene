import type { PresentationEntry } from './registry.ts'

/**
 * Explicit registry: adding a presentation is a new folder plus one entry here, an object
 * with a slug, a title and a load function that dynamically imports the folder's Talk.tsx.
 */
export const PRESENTATIONS: readonly PresentationEntry[] = [
]
