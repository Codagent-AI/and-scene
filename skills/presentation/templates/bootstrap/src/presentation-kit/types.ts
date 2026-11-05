import type { ComponentType } from 'react'
export type SceneProps<T> = { payload: T }
export type Step<T> = { id: string; era: string; title: string; caption: string; Scene: ComponentType<SceneProps<T>>; payload: T; groupKey?: string }
export type Mode = 'browse' | 'present'
