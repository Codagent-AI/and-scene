import type { ComponentType } from 'react'

export type Mode = 'present' | 'browse'

/** Narration and identity of the active step, passed to its scene. */
export interface StepMeta {
  id: string
  index: number
  count: number
  era: string
  title: string
  caption: string
}

export interface SceneProps<P = unknown> {
  payload: P
  step: StepMeta
}

/**
 * One named state of the evolving scene. Adjacent steps that share a `groupKey`
 * and the same `Scene` keep one mounted scene instance; only `payload` changes.
 */
export interface Step<P = unknown> {
  id: string
  era: string
  title: string
  caption: string
  Scene: ComponentType<SceneProps<P>>
  payload: P
  groupKey?: string
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Point {
  x: number
  y: number
}

export interface DesignSize {
  width: number
  height: number
}

export interface AttributionOptions {
  label?: string
  href?: string
}
