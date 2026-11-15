export const entity = (name: string) => `how-to-make:${name}`
export const positions = {
  you: { left: 65, top: 62, width: 122, height: 62 },
  prompt: { left: 65, top: 18, width: 122, height: 32 },
  skill: { left: 570, top: 62, width: 154, height: 62 },
  question: { left: 295, top: 42, width: 226, height: 30 },
  conversation: { left: 206, top: 85, width: 345, height: 24 },
  tray: { left: 65, top: 176, width: 690, height: 118 },
  depth: { left: 57, top: 134, width: 150, height: 28 },
  kit: { left: 280, top: 294, width: 260, height: 42 },
  verify: { left: 650, top: 210, width: 130, height: 65 },
  reveal: { left: 30, top: 5, width: 800, height: 356 },
} as const
export const visibleEntities = (beat: number) => [
  'you', 'prompt', ...(beat >= 2 ? ['skill', 'question', 'conversation'] : []),
  ...(beat >= 3 ? ['tray', 'card-1'] : []), ...(beat >= 4 ? ['card-2', 'card-3', 'morph-1', 'morph-2'] : []),
  ...(beat >= 5 ? ['ghost', 'depth'] : []), ...(beat >= 6 ? ['kit'] : []),
  ...(beat >= 7 ? ['verify', 'verify-link'] : []), ...(beat >= 8 ? ['modify', 'edited'] : []), ...(beat >= 9 ? ['reveal'] : []),
]
