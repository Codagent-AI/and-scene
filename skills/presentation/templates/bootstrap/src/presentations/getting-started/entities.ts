/** Stable `layoutId` namespace for this presentation's entities. */
export const E = {
  idea: 'getting-started.idea',
  link: 'getting-started.link',
  result: 'getting-started.result',
  note: 'getting-started.note',
} as const

/** Design-canvas geometry (880 × 380). Keep persisting entities at the same spot unless they should morph. */
export const G = {
  idea: { x: 80, y: 120, w: 220, h: 110 },
  link: { from: { x: 306, y: 175 }, to: { x: 574, y: 175 } },
  result: { x: 580, y: 120, w: 220, h: 110 },
  note: { x: 330, y: 250, w: 220, h: 36 },
}
