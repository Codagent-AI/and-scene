/**
 * Stable `layoutId` namespace for "How to Use This Skill to Make a
 * Presentation". Every entity that should morph across steps (rather than
 * remount) has one entry here — one per conceptual entity, not per step.
 */
export const ENTITIES = {
  you: 'htmasp-you',
  skill: 'htmasp-skill',
  prompt: 'htmasp-prompt',
  questionChip: 'htmasp-question-chip',
  conversationArrow: 'htmasp-conversation-arrow',
  card1: 'htmasp-card-1',
  card2: 'htmasp-card-2',
  card3: 'htmasp-card-3',
  ghostCard: 'htmasp-ghost-card',
  partialControl: 'htmasp-partial-control',
  kitSocket: 'htmasp-kit-socket',
  verifyNode: 'htmasp-verify-node',
  verifyCheck: 'htmasp-verify-check',
  modifyArc: 'htmasp-modify-arc',
  revealFrame: 'htmasp-reveal-frame',
} as const
