import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Props every scene component receives: the active step's payload. */
export interface SceneProps<TPayload = unknown> {
  payload: TPayload
}

export type Scene<TPayload = unknown> = ComponentType<SceneProps<TPayload>>

/**
 * One named state of the evolving scene. Steps that share a `groupKey` and a
 * `Scene` component keep that scene mounted; only `payload` changes.
 */
export interface Step<TPayload = unknown> {
  id: string
  /** Section/era label; consecutive steps with the same era form a ToC entry. */
  era: string
  /** Presenter title (one-liner). */
  title: string
  /** Browse caption (paragraph). */
  caption: string
  Scene: Scene<TPayload>
  payload: TPayload
  groupKey?: string
}

export interface Canvas {
  width: number
  height: number
}

export interface ModeGeometry {
  /** Pixels reserved above the stage for the header. */
  top: number
  /** Pixels reserved below the stage for the footer. */
  bottom: number
  /** Pixels reserved beside the stage for the table of contents (wide only). */
  side: number
}

/** The narration half of a step; chrome needs nothing more. */
export type StepMeta = Pick<Step, 'id' | 'era' | 'title' | 'caption'>
