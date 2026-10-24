/**
 * Starter presentation: this presentation's layoutId namespace and geometry in
 * design-canvas pixels (880 × 380). Give every entity one rectangle for its
 * whole life so entities accumulate and morph in place instead of redrawing.
 */
export const GEOMETRY = {
  topic: { x: 60, y: 140, w: 180, h: 80 },
  idea: { x: 350, y: 140, w: 180, h: 80 },
  link: { x: 240, y: 180, w: 110, h: 0 },
} as const

export type EntityId = keyof typeof GEOMETRY

export interface ScenePayload {
  /** Entities on screen at this step, in draw order. */
  visible: readonly EntityId[]
}
