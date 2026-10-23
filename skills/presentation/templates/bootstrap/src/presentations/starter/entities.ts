/** Entity ids (the layoutId namespace) for this presentation, and when each first appears. */
export const APPEARS_AT = { first: 1, second: 2, link: 3 } as const
export type EntityId = keyof typeof APPEARS_AT

export const entitiesAt = (step: number): EntityId[] =>
  (Object.keys(APPEARS_AT) as EntityId[]).filter((id) => APPEARS_AT[id] <= step)
