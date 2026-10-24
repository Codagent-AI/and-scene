// This presentation's layoutId namespace. Ids are stable across steps, so an
// entity that persists keeps its identity and never re-enters.
export const E = {
  you: 'htmp/you',
  prompt: 'htmp/prompt',
  skill: 'htmp/skill',
  conversation: 'htmp/conversation',
  question: 'htmp/question',
  card: (n: number) => `htmp/card-${n}`,
  link: (n: number) => `htmp/link-${n}`,
  morph: (n: number) => `htmp/morph-${n}`,
  ghost: 'htmp/ghost',
  depth: 'htmp/depth',
  kit: 'htmp/kit',
  kitPlug: 'htmp/kit-plug',
  chain: 'htmp/chain',
  verify: 'htmp/verify',
  pass: 'htmp/pass',
  modify: 'htmp/modify',
  modifyTag: 'htmp/modify-tag',
  edited: 'htmp/edited',
  editedFlag: 'htmp/edited-flag',
  frame: 'htmp/frame',
  frameLabel: 'htmp/frame-label',
} as const

// Fixed design-canvas geometry (880 x 380). Entities accumulate and are never
// moved, so every coordinate below is used by every step that shows it.
export const CARD = { y: 160, w: 104, h: 90, gap: 30, x0: 30 }
export const cardX = (n: number) => CARD.x0 + n * (CARD.w + CARD.gap)
