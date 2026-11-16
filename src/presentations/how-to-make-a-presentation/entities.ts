export const entity = (name: string) => `how-to-make-a-presentation:${name}`
// Stable design coordinates: later beats add entities, never reposition them.
export const positions = {
  you: [60, 55, 110, 60], prompt: [190, 50, 155, 64], skill: [595, 55, 130, 60],
  conversation: [365, 76, 205, 25], question: [385, 38, 170, 24],
  tray: [60, 177, 750, 134], card1: [70, 215, 130, 92], card2: [250, 215, 130, 92],
  card3: [430, 215, 130, 92], morph1: [202, 246, 46, 42], morph2: [382, 246, 46, 42],
  ghost: [580, 215, 76, 92], depth: [60, 128, 165, 28], kit: [335, 308, 225, 37],
  verify: [682, 215, 130, 92], verifyLink: [658, 251, 24, 24], reveal: [10, 12, 860, 350],
} as const
