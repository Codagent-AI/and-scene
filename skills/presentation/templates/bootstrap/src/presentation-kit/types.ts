import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
  step: Step<TPayload>
  index: number
}

interface StepBase<TPayload> {
  /** Stable identity of the step. */
  id: string
  /** Section / era label; consecutive steps sharing a label form one table-of-contents entry. */
  era: string
  /** One-line presenter title. */
  title: string
  /** Paragraph shown in browse mode. */
  caption: string
  /** Scene component showing the diagram state of this step. */
  Scene: ComponentType<SceneProps<TPayload>>
  /** Adjacent steps sharing a groupKey (and Scene) update one mounted scene in place. */
  groupKey?: string
}

export type Step<TPayload = undefined> = StepBase<TPayload> &
  (undefined extends TPayload ? { payload?: TPayload } : { payload: TPayload })

export interface Section {
  era: string
  firstIndex: number
  lastIndex: number
}

export interface AttributionOptions {
  label?: string
  href?: string
}
