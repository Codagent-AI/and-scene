import type { ComponentType } from 'react'

export type PresentationMode = 'browse' | 'present'
export type StepMeta = { id: string; era: string; title: string; caption: string }
export type SceneProps<TPayload> = { payload: TPayload; step: StepMeta; index: number }
export type Step<TPayload = undefined> = StepMeta & {
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}
export type PresentationProps<TPayload> = {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: PresentationMode
  designSize?: { width: number; height: number }
  attribution?: false | { href?: string; label?: string }
}
