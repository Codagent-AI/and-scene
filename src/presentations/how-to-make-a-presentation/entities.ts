// Stable layoutId namespace for this presentation's entities. The whole talk
// is one continuously evolving scene: every entity below appears once and
// persists (via its layoutId) for the rest of the presentation — nothing is
// ever removed or redrawn once it has landed on stage.
export const ENTITY = {
  you: 'you',
  prompt: 'prompt',
  skill: 'skill',
  connector: 'connector',
  questionChip: 'question-chip',
  tray: 'tray',
  cardStep: 'card-step',
  cardDeck: 'card-deck',
  ghostCard: 'ghost-card',
  depthControl: 'depth-control',
  sceneKit: 'scene-kit',
  verifyNode: 'verify-node',
  modifyArc: 'modify-arc',
  outerFrame: 'outer-frame',
} as const
