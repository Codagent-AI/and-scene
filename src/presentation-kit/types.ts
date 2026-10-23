import { createElement } from 'react'
import type { ComponentType, ReactElement } from 'react'

/** Narration and identity carried by every step. */
export interface StepMeta {
  /** Stable step identity. */
  id: string
  /** Section / era label used by the table of contents. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
}

export interface SceneProps<TPayload = undefined> {
  payload: TPayload
}

/** Authoring shape: a scene component plus the payload for this step. */
export interface Step<TPayload = undefined> extends StepMeta {
  /** Steps sharing a groupKey (and Scene) keep one mounted scene instance. */
  groupKey?: string
  Scene: ComponentType<SceneProps<TPayload>>
  payload: TPayload
}

/** Payload-erased step accepted by `<Presentation>`. */
export interface PresentationStep extends StepMeta {
  groupKey?: string
  render: () => ReactElement
}

/** Erase the payload type while keeping the Scene/payload pairing checked. */
export function defineStep<TPayload>(step: Step<TPayload>): PresentationStep {
  const { Scene, payload, ...rest } = step
  return { ...rest, render: () => createElement(Scene, { payload }) }
}

export interface Attribution {
  label: string
  href: string
}
