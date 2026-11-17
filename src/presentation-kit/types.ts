import type { ComponentType, ReactNode } from 'react'
export type Mode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<T = undefined> { payload: T }
export type Scene<T = undefined> = ComponentType<SceneProps<T>>
export interface Step<T = undefined> extends StepMeta { Scene: Scene<T>; payload: T; groupKey?: string }
export interface PresentationProps<T> {
  steps: readonly Step<T>[]; title: string; initialMode?: Mode; brand?: ReactNode
  attribution?: ReactNode; designWidth?: number; designHeight?: number
}
