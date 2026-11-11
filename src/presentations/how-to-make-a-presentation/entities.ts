export const entity = (name: string) => `how-to-make-a-presentation:${name}`
export const positions = {
  you: { left: 76, top: 42, width: 110, height: 62 },
  prompt: { left: 76, top: 8, width: 150, height: 25 },
  skill: { left: 490, top: 42, width: 140, height: 62 },
  question: { left: 270, top: 30, width: 160, height: 24 },
  conversation: { left: 204, top: 70, width: 260, height: 25 },
  tray: { left: 62, top: 185, width: 756, height: 138 },
  depth: { left: 76, top: 112, width: 150, height: 25 },
  kit: { left: 260, top: 310, width: 195, height: 38 },
  verify: { left: 665, top: 211, width: 130, height: 90 },
  reveal: { left: 34, top: 0, width: 812, height: 370 },
} as const
export const cardPosition = (index: number) => ({ left: 82 + index * 142, top: 211, width: 116, height: 90 })
