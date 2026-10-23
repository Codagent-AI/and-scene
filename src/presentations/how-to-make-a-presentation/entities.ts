/**
 * This presentation's layoutId namespace. Every entity is created once, on the
 * step index given here, and then stays put: the scene only accumulates.
 */
export const ENTITIES = {
  you: 0,
  prompt: 0,
  skill: 1,
  askArrow: 1,
  questionChip: 1,
  tray: 2,
  routeLabel: 2,
  card1: 2,
  link1: 2,
  link1Chip: 2,
  card2: 3,
  card3: 3,
  link2: 3,
  link2Chip: 3,
  ghostCard: 4,
  depthControl: 4,
  sceneKit: 5,
  verify: 6,
  link3: 6,
  verifyPass: 6,
  modifyArc: 7,
  modifyLabel: 7,
  editedRing: 7,
  editedChip: 7,
  outerFrame: 8,
  revealLabel: 8,
} as const

export type EntityId = keyof typeof ENTITIES

export const entityId = (key: EntityId): string => `how-to-${key}`
