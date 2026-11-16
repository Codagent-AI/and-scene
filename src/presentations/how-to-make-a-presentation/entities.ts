export const entity = (name: string) => `how-to-make-a-presentation:${name}`
// One authored canvas at every viewport. Its taller aspect ratio leaves room for
// 36px+ labels that still render at 12px+ when uniformly fitted at 390px wide.
export const CANVAS = { width: 880, height: 1200 }
// Later beats add entities, never reposition them or reflow the diagram.
export const positions = {
  you: [60, 180, 150, 120], prompt: [60, 390, 390, 180], skill: [655, 180, 165, 120],
  conversation: [230, 210, 400, 70], question: [270, 70, 350, 100],
  tray: [30, 590, 820, 355], card1: [30, 650, 130, 295], card2: [270, 650, 130, 295],
  card3: [510, 650, 130, 295], morph1: [162, 740, 106, 140], morph2: [402, 740, 106, 140],
  ghost: [655, 650, 60, 295], depth: [60, 300, 270, 70], kit: [260, 942, 420, 160],
  verify: [730, 650, 120, 295], verifyLink: [715, 750, 15, 70], reveal: [10, 10, 860, 1160],
} as const
