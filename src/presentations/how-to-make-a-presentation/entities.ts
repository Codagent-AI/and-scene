/** Stable entity ids (the `layoutId` namespace) and the step at which each one first appears. */
export const ENTITIES = {
  you: { id: 'htmp-you', since: 1 },
  prompt: { id: 'htmp-prompt', since: 1 },
  skill: { id: 'htmp-skill', since: 2 },
  dialogue: { id: 'htmp-dialogue', since: 2 },
  question: { id: 'htmp-question', since: 2 },
  tray: { id: 'htmp-tray', since: 3 },
  trayLabel: { id: 'htmp-tray-label', since: 3 },
  card1: { id: 'htmp-card-1', since: 3 },
  morphLink: { id: 'htmp-link-1-2', since: 3 },
  morphChip: { id: 'htmp-morph-chip', since: 3 },
  card2: { id: 'htmp-card-2', since: 4 },
  card3: { id: 'htmp-card-3', since: 4 },
  card4: { id: 'htmp-card-4', since: 4 },
  link23: { id: 'htmp-link-2-3', since: 4 },
  link34: { id: 'htmp-link-3-4', since: 4 },
  ghost: { id: 'htmp-ghost', since: 5 },
  link4Ghost: { id: 'htmp-link-4-ghost', since: 5 },
  depth: { id: 'htmp-depth', since: 5 },
  sceneKit: { id: 'htmp-scene-kit', since: 6 },
  verify: { id: 'htmp-verify', since: 7 },
  linkVerify: { id: 'htmp-link-ghost-verify', since: 7 },
  verifyCheck: { id: 'htmp-verify-check', since: 7 },
  modify: { id: 'htmp-modify', since: 8 },
  modifyChip: { id: 'htmp-modify-chip', since: 8 },
  edited: { id: 'htmp-edited', since: 8 },
  editedFlag: { id: 'htmp-edited-flag', since: 8 },
  frame: { id: 'htmp-frame', since: 9 },
} as const

export type EntityKey = keyof typeof ENTITIES

/** Diagram state of a step: the scene shows every entity introduced up to this step. */
export interface SampleState {
  upTo: number
}
