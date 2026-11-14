export const entities = {
  you: { x: 62, y: 60, w: 124, h: 60, from: 1 },
  prompt: { x: 62, y: 18, w: 210, h: 30, from: 1 },
  skill: { x: 650, y: 60, w: 150, h: 60, from: 2 },
  question: { x: 338, y: 42, w: 200, h: 30, from: 2 },
  conversation: { x: 208, y: 82, w: 416, h: 20, from: 2 },
  tray: { x: 82, y: 176, w: 738, h: 120, from: 3 },
  card1: { x: 112, y: 194, w: 122, h: 82, from: 3 },
  card2: { x: 292, y: 194, w: 122, h: 82, from: 4 },
  link1: { x: 240, y: 223, w: 46, h: 20, from: 4 },
  card3: { x: 472, y: 194, w: 122, h: 82, from: 4 },
  link2: { x: 420, y: 223, w: 46, h: 20, from: 4 },
  ghost: { x: 622, y: 194, w: 70, h: 82, from: 5 },
  depth: { x: 62, y: 128, w: 155, h: 27, from: 5 },
  kit: { x: 292, y: 296, w: 302, h: 36, from: 6 },
  verify: { x: 734, y: 202, w: 76, h: 66, from: 7 },
  verifyLink: { x: 698, y: 223, w: 30, h: 20, from: 7 },
  modify: { x: 228, y: 122, w: 365, h: 66, from: 8 },
  edited: { x: 492, y: 178, w: 82, h: 22, from: 8 },
  reveal: { x: 16, y: 3, w: 848, h: 367, from: 9 },
} as const
export type EntityId = keyof typeof entities
export const entityId = (id: EntityId) => `how-to:${id}`
export function visibleEntities(beat: number) { return Object.entries(entities).filter(([, entity]) => entity.from <= beat).map(([id]) => id) }
