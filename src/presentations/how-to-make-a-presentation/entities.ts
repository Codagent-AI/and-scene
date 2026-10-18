/** layoutId namespace for this presentation's entities; ids stay stable across every step. */
export const E = {
  you: 'hmp-you',
  prompt: 'hmp-prompt',
  skill: 'hmp-skill',
  talk: 'hmp-talk-arrow',
  chip: 'hmp-question-chip',
  focus: 'hmp-focus',
  tray: 'hmp-tray',
  card: (n: number) => `hmp-card-${n}`,
  link: (n: number) => `hmp-link-${n}`,
  morph: 'hmp-morph',
  ghost: 'hmp-ghost',
  depth: 'hmp-depth',
  kit: 'hmp-scene-kit',
  verify: 'hmp-verify',
  verifyLink: 'hmp-verify-link',
  pass: 'hmp-pass',
  route: 'hmp-route',
  modifyDown: 'hmp-modify-down',
  modifyIn: 'hmp-modify-in',
  edited: 'hmp-edited',
  frame: 'hmp-frame',
} as const

/** Canvas rectangles shared between entities and the focus ring that morphs between them. */
export const RECT = {
  you: { x: 40, y: 24, width: 150, height: 64 },
  skill: { x: 690, y: 24, width: 150, height: 64 },
  card: (n: number) => ({ x: 60 + (n - 1) * 136, y: 194, width: 92, height: 96 }),
  ghost: { x: 604, y: 194, width: 92, height: 96 },
  kit: { x: 300, y: 300, width: 240, height: 40 },
  verify: { x: 740, y: 194, width: 92, height: 96 },
} as const
