import type { ComponentType, ReactNode } from 'react'
export type Mode = 'browse' | 'present'
export interface StepMeta { id: string; era: string; title: string; caption: string }
export interface SceneProps<TPayload> { payload: TPayload }
export type Scene<TPayload> = ComponentType<SceneProps<TPayload>>
export interface Step<TPayload> extends StepMeta { Scene: Scene<TPayload>; payload: TPayload; groupKey?: string }
export interface PresentationOptions { title: string; initialMode?: Mode; brand?: ReactNode; className?: string }
