/**
 * __SLUG__'s layoutId namespace. Each entity is created on the step index
 * listed here and keeps this id for as long as it stays on screen.
 */
export const ENTITIES = {
  subject: 0,
  detail: 1,
} as const

export type EntityId = keyof typeof ENTITIES

export const entityId = (key: EntityId): string => `__SLUG__-${key}`
