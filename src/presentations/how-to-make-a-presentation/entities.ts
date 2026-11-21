export const entities = {
  you: { left: 98, top: 61, width: 144, height: 53 },
  prompt: { left: 85, top: 18, width: 170, height: 40 },
  skill: { left: 638, top: 61, width: 144, height: 53 },
  conversation: { left: 258, top: 78, width: 364, height: 20 },
  question: { left: 260, top: 40, width: 360, height: 38 },
  tray: { left: 26, top: 184, width: 828, height: 157 },
  first: { left: 42, top: 201, width: 148, height: 136 },
  firstLink: { left: 194, top: 262, width: 33, height: 14 },
  morph: { left: 155, top: 165, width: 111, height: 34 },
  second: { left: 230, top: 201, width: 120, height: 136 },
  secondLink: { left: 353, top: 262, width: 23, height: 14 },
  third: { left: 379, top: 201, width: 135, height: 136 },
  ghostLink: { left: 517, top: 262, width: 23, height: 14 },
  ghost: { left: 543, top: 201, width: 115, height: 136 },
  depth: { left: 58, top: 120, width: 224, height: 36 },
  kit: { left: 280, top: 339, width: 320, height: 37 },
  checkLink: { left: 661, top: 262, width: 22, height: 14 },
  verify: { left: 686, top: 201, width: 151, height: 136 },
  modify: { left: 457, top: 111, width: 171, height: 87 },
  modifyLabel: { left: 526, top: 143, width: 118, height: 34 },
  edited: { left: 485, top: 205, width: 25, height: 25 },
  reveal: { left: 10, top: 12, width: 860, height: 367 },
  revealLabel: { left: 646, top: 340, width: 190, height: 38 },
} as const

export type EntityId = keyof typeof entities

export function layoutId(id: EntityId) {
  return `how-to-make-a-presentation:${id}`
}
