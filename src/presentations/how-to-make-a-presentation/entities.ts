export const ENTITY = {
  you: 'how-to-you',
  prompt: 'how-to-prompt',
  skill: 'how-to-skill',
  conversation: 'how-to-conversation',
  question: 'how-to-question',
  tray: 'how-to-card-tray',
  kit: 'how-to-scene-kit',
  verify: 'how-to-verify',
  modify: 'how-to-modify',
  edited: 'how-to-edited-card',
  reveal: 'how-to-reveal',
} as const

export const STEP_CARD_IDS = Array.from({ length: 9 }, (_, index) => `how-to-step-${index + 1}`)
