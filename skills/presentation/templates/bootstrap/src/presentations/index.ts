import type { ComponentType } from 'react'
export const presentations: { slug: string; title: string; load: () => Promise<{ default: ComponentType }> }[] = []
