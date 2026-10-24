/**
 * This presentation's entity namespace: stable ids, the stage (step number) each first
 * appears in, and design-canvas geometry (880 x 380). Persisting entities keep their id;
 * change `x`/`y`/`w`/`h`/`text` per stage only when you want them to morph in place.
 */
export interface Entity {
  id: string
  since: number
  x: number
  y: number
  w: number
  h: number
  text: string
}

export const ENTITIES: readonly Entity[] = [
  { id: 'idea', since: 1, x: 60, y: 140, w: 200, h: 80, text: 'an idea' },
  { id: 'next', since: 2, x: 340, y: 140, w: 200, h: 80, text: 'the next beat' },
]

export const entitiesAt = (stage: number) => ENTITIES.filter((entity) => entity.since <= stage)
