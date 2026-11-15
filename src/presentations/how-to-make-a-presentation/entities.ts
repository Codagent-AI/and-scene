export const entity = (name: string) => `how-to-make:${name}`
// One authored composition at every viewport; the reusable kit keeps its 880 × 380 default.
export const SAMPLE_CANVAS = { width: 400, height: 460 } as const
export const positions = {
  you: { left: 20, top: 64, width: 100, height: 64 },
  prompt: { left: 12, top: 14, width: 160, height: 38 },
  skill: { left: 270, top: 64, width: 110, height: 64 },
  question: { left: 182, top: 14, width: 206, height: 38 },
  conversation: { left: 132, top: 84, width: 126, height: 24 },
  tray: { left: 12, top: 188, width: 376, height: 168 },
  depth: { left: 20, top: 138, width: 140, height: 32 },
  kit: { left: 90, top: 356, width: 220, height: 62 },
  verify: { left: 328, top: 226, width: 60, height: 130 },
  ghost: { left: 294, top: 226, width: 28, height: 130 },
  verifyLink: { left: 323, top: 282, width: 4, height: 16 },
  modify: { left: 312, top: 134, width: 68, height: 86 },
  edited: { left: 210, top: 196, width: 140, height: 20 },
  reveal: { left: 2, top: 4, width: 396, height: 450 },
} as const
export const cardPosition = (index: number) => ({ left: 12 + index * 106, top: 226, width: 64, height: 130 })
export const morphPosition = (index: number) => ({ left: 77 + index * 106, top: 264, width: 40, height: 50 })
export const visibleEntities = (beat: number) => [
  'you', 'prompt', ...(beat >= 2 ? ['skill', 'question', 'conversation'] : []),
  ...(beat >= 3 ? ['tray', 'card-1'] : []), ...(beat >= 4 ? ['card-2', 'card-3', 'morph-1', 'morph-2'] : []),
  ...(beat >= 5 ? ['ghost', 'depth'] : []), ...(beat >= 6 ? ['kit'] : []),
  ...(beat >= 7 ? ['verify', 'verify-link'] : []), ...(beat >= 8 ? ['modify', 'edited'] : []), ...(beat >= 9 ? ['reveal'] : []),
]
