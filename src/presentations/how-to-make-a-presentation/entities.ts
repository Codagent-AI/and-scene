export const entities = {
  you: { left: 98, top: 67, width: 144, height: 56 },
  prompt: { left: 85, top: 24, width: 170, height: 40 },
  skill: { left: 638, top: 67, width: 144, height: 56 },
  conversation: { left: 258, top: 85, width: 364, height: 20 },
  question: { left: 260, top: 47, width: 360, height: 38 },
  tray: { left: 26, top: 184, width: 828, height: 135 },
  first: { left: 42, top: 202, width: 148, height: 105 },
  firstLink: { left: 194, top: 248, width: 33, height: 14 },
  morph: { left: 155, top: 167, width: 111, height: 34 },
  second: { left: 230, top: 202, width: 120, height: 105 },
  secondLink: { left: 353, top: 248, width: 23, height: 14 },
  third: { left: 379, top: 202, width: 135, height: 105 },
  ghostLink: { left: 517, top: 248, width: 23, height: 14 },
  ghost: { left: 543, top: 202, width: 115, height: 105 },
  depth: { left: 58, top: 131, width: 224, height: 35 },
  kit: { left: 280, top: 317, width: 320, height: 45 },
  checkLink: { left: 661, top: 248, width: 22, height: 14 },
  verify: { left: 686, top: 202, width: 151, height: 105 },
  modify: { left: 457, top: 111, width: 171, height: 87 },
  modifyLabel: { left: 526, top: 143, width: 118, height: 34 },
  edited: { left: 485, top: 205, width: 25, height: 25 },
  reveal: { left: 10, top: 12, width: 860, height: 351 },
  revealLabel: { left: 646, top: 340, width: 190, height: 38 },
} as const

export type EntityId = keyof typeof entities

export function layoutId(id: EntityId) {
  return `how-to-make-a-presentation:${id}`
}
