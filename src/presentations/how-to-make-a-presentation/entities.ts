/**
 * how-to-make-a-presentation's layoutId namespace.
 *
 * The whole talk is one continuously evolving scene: every entity below
 * mounts once and then persists (or morphs in place) for the rest of the
 * steps. None of them are ever unmounted or repositioned once they appear.
 */
export const ENTITY = {
  you: 'htmap-you',
  prompt: 'htmap-prompt',
  skill: 'htmap-skill',
  askArrow: 'htmap-ask-arrow',
  questionChip: 'htmap-question-chip',
  depthControl: 'htmap-depth-control',
  card1: 'htmap-card-1',
  card2: 'htmap-card-2',
  cardLink: 'htmap-card-link',
  ghostCard: 'htmap-ghost-card',
  sceneKitSocket: 'htmap-scene-kit-socket',
  verifyNode: 'htmap-verify-node',
  modifyArc: 'htmap-modify-arc',
  route: 'htmap-route',
  editedFlag: 'htmap-edited-flag',
  revealFrame: 'htmap-reveal-frame',
  revealLabel: 'htmap-reveal-label',
} as const
