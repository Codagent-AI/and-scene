/** This presentation's layoutId namespace: every entity has one stable id and geometry. */
export interface EntityDef {
  id: string
  /** First step (1-based) in which the entity appears; it then stays on screen. */
  since: number
  x: number
  y: number
  width: number
  height: number
}

export const ENTITIES: readonly EntityDef[] = [
  { id: 'start', since: 1, x: 60, y: 140, width: 180, height: 80 },
  { id: 'next', since: 2, x: 640, y: 140, width: 180, height: 80 },
]

export interface Edge {
  id: string
  since: number
  from: readonly [number, number]
  to: readonly [number, number]
}

export const EDGES: readonly Edge[] = [{ id: 'start-to-next', since: 2, from: [240, 180], to: [640, 180] }]
