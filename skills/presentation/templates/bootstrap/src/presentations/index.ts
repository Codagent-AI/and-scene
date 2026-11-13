import type { ComponentType } from 'react'
export interface RegistryEntry { slug: string; title: string; load: () => Promise<{default: ComponentType}> }
export const presentations: RegistryEntry[] = []
export const resolvePresentation = (path:string) => presentations.find(p=>path===`/${p.slug}`)
