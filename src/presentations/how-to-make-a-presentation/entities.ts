const prefix = 'how-to-make-a-presentation'

export const entities = {
  you: `${prefix}:you`,
  prompt: `${prefix}:prompt`,
  skill: `${prefix}:skill`,
  question: `${prefix}:question`,
  conversationArrow: `${prefix}:conversation-arrow`,
  tray: `${prefix}:tray`,
  morph: `${prefix}:morph`,
  ghost: `${prefix}:ghost`,
  depth: `${prefix}:depth`,
  sceneKit: `${prefix}:scene-kit`,
  verify: `${prefix}:verify`,
  pass: `${prefix}:pass`,
  modify: `${prefix}:modify`,
  modified: `${prefix}:modified`,
  reveal: `${prefix}:reveal`,
  cards: [
    `${prefix}:step-card-1`,
    `${prefix}:step-card-2`,
    `${prefix}:step-card-3`,
    `${prefix}:step-card-4`,
  ],
} as const
