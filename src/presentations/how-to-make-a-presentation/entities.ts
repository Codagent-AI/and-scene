/** Stable layoutId namespace — entities morph across steps when ids match. */
export const ENTITIES = {
  you: 'you',
  prompt: 'prompt',
  questionChip: 'question-chip',
  convoArrow: 'convo-arrow',
  skill: 'skill',
  stepCard1: 'step-card-1',
  stepCard2: 'step-card-2',
  stepCard3: 'step-card-3',
  ghostCard: 'ghost-card',
  depthChip: 'depth-chip',
  tray: 'tray',
  kitSocket: 'kit-socket',
  verifyArrow: 'verify-arrow',
  verifyNode: 'verify-node',
  greenCheck: 'green-check',
  editBadge: 'edit-badge',
} as const

export type EntityId = (typeof ENTITIES)[keyof typeof ENTITIES]
