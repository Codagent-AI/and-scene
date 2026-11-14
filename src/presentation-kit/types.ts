import type { ComponentType, ReactNode } from 'react'
export type Mode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<TPayload> { payload: TPayload }
export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>
export interface Step<TPayload = undefined> extends StepMeta {
  Scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}
export interface Attribution { label: string; href: string }
export interface PresentationProps<TPayload> {
  steps: readonly Step<TPayload>[]
  title: string
  initialMode?: Mode
  brand?: ReactNode
  attribution?: Attribution | false
}
export function validateSteps(steps: readonly StepMeta[]) {
  if (!steps.length) throw new Error('A presentation needs at least one step')
  const ids = new Set<string>()
  for (const step of steps) {
    for (const key of ['id', 'era', 'title', 'caption'] as const) {
      if (!step[key]?.trim()) throw new Error(`Missing step ${key}`)
    }
    if (ids.has(step.id)) throw new Error(`Duplicate step id: ${step.id}`)
    ids.add(step.id)
  }
}
