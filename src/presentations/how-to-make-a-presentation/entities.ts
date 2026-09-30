/**
 * This presentation's own `layoutId` namespace. Every stable on-screen
 * entity that should morph across steps (rather than remount from scratch)
 * gets a unique id here, so every step file imports from one place instead
 * of hand-rolling strings.
 */
export const entities = {
  you: 'you',
  prompt: 'prompt',
  skill: 'skill',
  conversationLink: 'conversation-link',
  questionChip: 'question-chip',
  card1: 'card-1',
  card2: 'card-2',
  card3: 'card-3',
  card4: 'card-4',
  cardLink12: 'card-link-1-2',
  cardLink23: 'card-link-2-3',
  cardLink34: 'card-link-3-4',
  ghostCard: 'ghost-card',
  ghostLink: 'card-link-4-ghost',
  depthControl: 'depth-control',
  kitSocket: 'kit-socket',
  verifyNode: 'verify-node',
  verifyLink: 'ghost-verify-link',
  verifyCheck: 'verify-check',
  modifyArc: 'modify-arc',
  modifyLabel: 'modify-label',
  editedFlag: 'edited-flag',
  revealFrame: 'reveal-frame',
  revealLabel: 'reveal-label',
} as const
