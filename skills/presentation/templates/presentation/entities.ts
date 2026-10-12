// Stable IDs for entities that persist or morph between steps in this presentation.
export const ENTITY_IDS = ['example'] as const
export type EntityId = typeof ENTITY_IDS[number]
