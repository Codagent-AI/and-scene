export const entities = {
  you: { x: 20, y: 44, w: 150, h: 56, from: 1 },
  prompt: { x: 24, y: 10, w: 280, h: 30, from: 1 },
  skill: { x: 690, y: 44, w: 170, h: 56, from: 2 },
  question: { x: 300, y: 38, w: 300, h: 28, from: 2 },
  conversation: { x: 190, y: 62, w: 480, h: 20, from: 2 },
  tray: { x: 20, y: 148, w: 840, h: 142, from: 3 },
  card1: { x: 40, y: 182, w: 120, h: 96, from: 3 },
  card2: { x: 248, y: 182, w: 120, h: 96, from: 4 },
  link1: { x: 164, y: 220, w: 80, h: 20, from: 4 },
  card3: { x: 456, y: 182, w: 120, h: 96, from: 4 },
  link2: { x: 372, y: 220, w: 80, h: 20, from: 4 },
  ghost: { x: 600, y: 182, w: 110, h: 96, from: 5 },
  depth: { x: 20, y: 106, w: 200, h: 34, from: 5 },
  kit: { x: 190, y: 290, w: 500, h: 40, from: 6 },
  verify: { x: 756, y: 182, w: 84, h: 96, from: 7 },
  verifyLink: { x: 716, y: 220, w: 34, h: 20, from: 7 },
  modify: { x: 240, y: 100, w: 280, h: 56, from: 8 },
  edited: { x: 466, y: 154, w: 110, h: 28, from: 8 },
  reveal: { x: 10, y: 0, w: 860, h: 356, from: 9 },
} as const
export type EntityId = keyof typeof entities
export const entityId = (id: EntityId) => `how-to:${id}`
export function visibleEntities(beat: number) { return Object.entries(entities).filter(([, entity]) => entity.from <= beat).map(([id]) => id) }
