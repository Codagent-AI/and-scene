import type { ComponentType } from 'react'

export interface PresentationModule { default: ComponentType<Record<string, never>> }
export interface PresentationRegistration { slug: string; title: string; load: () => Promise<PresentationModule> }

export const presentations: readonly PresentationRegistration[] = []
