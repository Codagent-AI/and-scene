import type { ComponentType } from 'react';
export type PresentationMode = 'browse' | 'present';
export interface StepMeta {
    id: string;
    era: string;
    title: string;
    caption: string;
    groupKey?: string;
}
export interface SceneProps<TPayload = undefined> {
    payload: TPayload;
    step: StepMeta;
}
export type Scene<TPayload = undefined> = ComponentType<SceneProps<TPayload>>;
export interface Step<TPayload = undefined> extends StepMeta {
    Scene: Scene<TPayload>;
    payload: TPayload;
}
