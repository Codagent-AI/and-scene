import type { ComponentType, ReactNode } from 'react'
export type Mode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<TPayload = undefined> { payload: TPayload; step: StepMeta; index: number }
export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}
export interface PresentationOptions { title: string; initialMode?: Mode; brand?: ReactNode; attribution?: ReactNode }
