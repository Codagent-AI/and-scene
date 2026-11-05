import type { ComponentType } from 'react'
export interface SceneProps<T> { payload: T }
export interface Step<T> { id: string; era: string; title: string; caption: string; Scene: ComponentType<SceneProps<T>>; payload: T; groupKey?: string }
