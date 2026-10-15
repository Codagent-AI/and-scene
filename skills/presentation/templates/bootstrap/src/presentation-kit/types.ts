import type { ComponentType, ReactNode } from 'react'

export type PresentationMode = 'browse' | 'present'
export type StepMeta = { id: string; era: string; title: string; caption: string }
export type SceneProps<TPayload = undefined> = { payload: TPayload; step: StepMeta; index: number; total: number }
export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>
export type Step<TPayload = undefined> = StepMeta & { Scene: Scene<TPayload>; payload: TPayload; groupKey?: string }
export type Attribution = { href: string; label: string }
export type PresentationProps<TPayload> = { steps: readonly Step<TPayload>[]; title: string; initialMode?: PresentationMode; attribution?: Attribution | false; brand?: ReactNode }
