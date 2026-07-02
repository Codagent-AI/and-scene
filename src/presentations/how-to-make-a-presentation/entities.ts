/** Stable layoutId namespace — entities morph across steps when ids match. */
export const ENTITIES = {
  you: 'you',
  prompt: 'prompt',
  skill: 'skill',
  questionLoop: 'question-loop',
  questionChip: 'question-chip',
  stepCard1: 'step-card-1',
  stepCard2: 'step-card-2',
  stepCard3: 'step-card-3',
  depthControl: 'depth-control',
  sceneKit: 'scene-kit',
  presentationRoute: 'presentation-route',
  verifyNode: 'verify-node',
  greenCheck: 'green-check',
  modifyLoop: 'modify-loop',
  revealFrame: 'reveal-frame',
  diagram: 'diagram',
} as const

export type EntityId = (typeof ENTITIES)[keyof typeof ENTITIES]
