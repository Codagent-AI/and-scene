/**
 * Stable layoutId namespace for how-to-make-a-presentation.
 *
 * Every entity that should morph (not remount) across steps needs a stable id
 * here, prefixed so it can never collide with another presentation's ids.
 */
export const entities = {
  you: 'htmap-you',
  prompt: 'htmap-prompt',
  skill: 'htmap-skill',
  conversationArrow: 'htmap-conversation-arrow',
  questionChip: 'htmap-question-chip',
  tray: 'htmap-tray',
  depthControl: 'htmap-depth-control',
  sceneKit: 'htmap-scene-kit',
  verify: 'htmap-verify',
  modifyArc: 'htmap-modify-arc',
  revealFrame: 'htmap-reveal-frame',
  card: (index: number) => `htmap-card-${index}`,
} as const
