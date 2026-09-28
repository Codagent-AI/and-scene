/**
 * layoutId namespace for how-to-make-a-presentation. Every entity that should
 * morph across steps (rather than remount) needs a stable id declared here,
 * scoped to this presentation so it never collides with another one.
 */
export const entities = {
  you: 'htmap-you',
  prompt: 'htmap-prompt',
  skill: 'htmap-skill',
  chatArrow: 'htmap-chat-arrow',
  questionChip: 'htmap-question-chip',
  card1: 'htmap-card-1',
  card2: 'htmap-card-2',
  card3: 'htmap-card-3',
  morphLink1: 'htmap-morph-link-1',
  morphLink2: 'htmap-morph-link-2',
  ghostCard: 'htmap-ghost-card',
  depthToggle: 'htmap-depth-toggle',
  sceneKitArrow: 'htmap-scene-kit-arrow',
  sceneKitChip: 'htmap-scene-kit-chip',
  verifyArrow: 'htmap-verify-arrow',
  verifyCard: 'htmap-verify-card',
  modifyArc: 'htmap-modify-arc',
  modifyChip: 'htmap-modify-chip',
  flagBadge: 'htmap-flag-badge',
  revealFrame: 'htmap-reveal-frame',
  revealLabel: 'htmap-reveal-label',
} as const
