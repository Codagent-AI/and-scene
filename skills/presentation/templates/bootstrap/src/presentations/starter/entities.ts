// Starter Presentation: this presentation's layoutId namespace. One stable id per thing on screen.
export const E = {
  idea: 'starter/idea',
  detail: 'starter/detail',
  link: 'starter/link',
} as const

export type EntityId = (typeof E)[keyof typeof E]

/** What a step tells the shared scene: everything on screen, and what is new in this step. */
export interface SceneState {
  shown: readonly EntityId[]
  entering: readonly EntityId[]
}

/** Entities accumulate: each step shows everything before it plus its newcomers. */
export function grow(previous: SceneState | null, added: readonly EntityId[]): SceneState {
  return { shown: [...(previous?.shown ?? []), ...added], entering: added }
}
