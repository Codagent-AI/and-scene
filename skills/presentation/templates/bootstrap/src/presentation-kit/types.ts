import type { ComponentType } from 'react'
export type Mode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<T = undefined> { payload: T }
export type Scene<T = undefined> = ComponentType<SceneProps<T>>
export interface Step<T = undefined> extends StepMeta { Scene: Scene<T>; payload: T; groupKey?: string }
