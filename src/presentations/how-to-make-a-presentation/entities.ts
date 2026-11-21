export const entities = {
  you: { left: 98, top: 67, width: 144, height: 64 },
  prompt: { left: 104, top: 27, width: 132, height: 36 },
  skill: { left: 638, top: 67, width: 144, height: 64 },
  conversation: { left: 258, top: 88, width: 364, height: 20 },
  question: { left: 310, top: 49, width: 260, height: 37 },
  tray: { left: 78, top: 180, width: 726, height: 126 },
  first: { left: 98, top: 201, width: 130, height: 87 },
  firstLink: { left: 230, top: 240, width: 40, height: 14 },
  morph: { left: 210, top: 180, width: 80, height: 20 },
  second: { left: 272, top: 201, width: 116, height: 87 },
  secondLink: { left: 390, top: 240, width: 23, height: 14 },
  third: { left: 415, top: 201, width: 116, height: 87 },
  ghostLink: { left: 533, top: 240, width: 23, height: 14 },
  ghost: { left: 558, top: 201, width: 104, height: 87 },
  depth: { left: 80, top: 139, width: 180, height: 33 },
  kit: { left: 328, top: 304, width: 226, height: 45 },
  checkLink: { left: 664, top: 240, width: 24, height: 14 },
  verify: { left: 690, top: 201, width: 94, height: 87 },
  modify: { left: 457, top: 111, width: 171, height: 87 },
  modifyLabel: { left: 526, top: 143, width: 96, height: 30 },
  edited: { left: 500, top: 203, width: 27, height: 25 },
  reveal: { left: 57, top: 13, width: 766, height: 350 },
  revealLabel: { left: 646, top: 348, width: 151, height: 29 },
} as const

export type EntityId = keyof typeof entities

export function layoutId(id: EntityId) {
  return `how-to-make-a-presentation:${id}`
}
