/** This presentation's layoutId namespace: one stable id per entity on the shared canvas. */
export const ID = {
  topic: '__SLUG__:topic',
} as const

export type EntityId = (typeof ID)[keyof typeof ID]

export interface EntityDef {
  x: number
  y: number
  w: number
  h: number
  label: string
}

/** The design canvas is 880 x 380. Persisting entities keep their id so they morph in place. */
export const ENTITIES: Record<EntityId, EntityDef> = {
  [ID.topic]: { x: 340, y: 150, w: 200, h: 80, label: '__TITLE__' },
}
