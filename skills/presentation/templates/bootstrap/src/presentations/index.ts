import type { ReactElement } from 'react'
export interface PresentationEntry { slug: string; title: string; load: () => Promise<{ default: () => ReactElement }> }
export const presentations: PresentationEntry[] = []
