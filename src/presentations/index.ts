import type { ComponentType } from 'react'

export type PresentationEntry = { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }
/** Explicit, stable registry. Add one entry per presentation. */
export const presentations: PresentationEntry[] = []
