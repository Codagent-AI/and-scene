// This presentation's layoutId namespace: stable entity ids, one per thing on screen.
export const E = {
  you: 'htmp/you',
  prompt: 'htmp/prompt',
  skill: 'htmp/skill',
  conversation: 'htmp/conversation',
  question: 'htmp/question-chip',
  tray: 'htmp/tray',
  card1: 'htmp/step-card-1',
  card2: 'htmp/step-card-2',
  card3: 'htmp/step-card-3',
  card4: 'htmp/step-card-4',
  link1: 'htmp/link-1',
  link2: 'htmp/link-2',
  link3: 'htmp/link-3',
  link4: 'htmp/link-4',
  morph1: 'htmp/morph-1',
  morph2: 'htmp/morph-2',
  morph3: 'htmp/morph-3',
  ghost: 'htmp/ghost-card',
  depth: 'htmp/depth-control',
  socket: 'htmp/scene-kit-socket',
  plug: 'htmp/scene-kit-plug',
  verify: 'htmp/verify',
  verifyLink: 'htmp/verify-link',
  pass: 'htmp/pass-check',
  modify: 'htmp/modify-arc',
  edited: 'htmp/edited-flag',
  editedRing: 'htmp/edited-ring',
  frame: 'htmp/frame',
  frameLabel: 'htmp/frame-label',
} as const

export type EntityId = (typeof E)[keyof typeof E]

/** What a step tells the shared scene: everything on screen, and what is new. */
export interface SampleState {
  shown: readonly EntityId[]
  entering: readonly EntityId[]
}

/** Entities accumulate: each step shows everything before it plus its newcomers. */
export function grow(previous: SampleState | null, added: readonly EntityId[]): SampleState {
  return { shown: [...(previous?.shown ?? []), ...added], entering: added }
}
