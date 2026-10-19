// This presentation's entity namespace. Every entity has one stable id and first
// appears at `from` (1-based step number). Persisting entities keep their id so
// they morph in place; add an entity only in the step where it first appears.
export const ns = (name: string) => `starter:${name}`

export interface Entity {
  id: string
  from: number
  kind: 'box' | 'arrow'
  x: number
  y: number
  w: number
  h: number
  text: string
}

export const ENTITIES: readonly Entity[] = [
  { id: ns('first'), from: 1, kind: 'box', x: 60, y: 140, w: 220, h: 100, text: 'first' },
  { id: ns('second'), from: 2, kind: 'box', x: 600, y: 140, w: 220, h: 100, text: 'second' },
  { id: ns('link'), from: 3, kind: 'arrow', x: 290, y: 190, w: 300, h: 0, text: '' },
]

export const entitiesAt = (stage: number): Entity[] => ENTITIES.filter((e) => e.from <= stage)
