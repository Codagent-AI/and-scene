/**
 * This presentation's entity namespace. Every value is a stable `layoutId`: an entity
 * that keeps its id across steps morphs in place instead of disappearing and reappearing.
 * Geometry is in design-canvas coordinates (880 x 380).
 */
export const ENTITY = {
  source: 'source',
  target: 'target',
  link: 'source-target-link',
} as const

export const RECT = {
  source: { left: 60, top: 140, width: 200, height: 80 },
  target: { left: 620, top: 140, width: 200, height: 80 },
}
