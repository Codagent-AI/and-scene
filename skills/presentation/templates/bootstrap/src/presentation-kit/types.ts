import type { ComponentType } from 'react'
export type SceneProps<TPayload> = { payload: TPayload }
export type Scene<TPayload = unknown> = ComponentType<SceneProps<TPayload>>
export type StepMeta = { id: string; section: string; title: string; caption: string; groupKey?: string }
export type Step<TPayload = unknown> = StepMeta & { Scene: Scene<TPayload>; payload: TPayload }
