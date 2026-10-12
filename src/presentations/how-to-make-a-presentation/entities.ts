export const ENTITY_IDS = [
  'you', 'prompt', 'skill', 'conversation-link', 'question-chip',
  'step-card-1', 'step-card-2', 'step-card-3', 'step-card-4', 'step-card-5',
  'ghost-card', 'depth-control', 'scene-kit', 'verify', 'modify', 'edited-card', 'outer-frame',
] as const

export type EntityId = typeof ENTITY_IDS[number]
