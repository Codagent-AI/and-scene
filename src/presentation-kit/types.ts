import type { ComponentType } from 'react'

export type Mode = 'browse' | 'present'

/** Narration + identity for one beat of the evolving diagram. */
export interface StepMeta {
  /** Stable key for AnimatePresence + React reconciliation. */
  id: string
  /** Header label, e.g. "the model". */
  era: string
  /** Presenter-mode one-liner. */
  title: string
  /** Browsing-mode paragraph. */
  caption: string
  /**
   * AnimatePresence key override. Consecutive steps that share a groupKey are
   * NOT remounted when navigating between them.
   */
  groupKey?: string
  /** Per-step data handed to the Scene. */
  payload?: Record<string, unknown>
}

export interface SceneProps {
  step: Step
}

export interface Step extends StepMeta {
  Scene: ComponentType<SceneProps>
}
