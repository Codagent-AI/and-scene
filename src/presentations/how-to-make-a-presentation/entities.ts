const prefix = 'how-to-make-a-presentation'

export const entities = {
  you: `${prefix}:you`,
  prompt: `${prefix}:prompt`,
  skill: `${prefix}:skill`,
  conversation: `${prefix}:conversation`,
  question: `${prefix}:question`,
  tray: `${prefix}:tray`,
  depth: `${prefix}:depth`,
  kit: `${prefix}:scene-kit`,
  verify: `${prefix}:verify`,
  verifyLink: `${prefix}:verify-link`,
  modify: `${prefix}:modify`,
  edited: `${prefix}:edited`,
  reveal: `${prefix}:reveal`,
  cards: Array.from({ length: 5 }, (_, index) => `${prefix}:step-card-${index + 1}`),
  cardLinks: Array.from({ length: 4 }, (_, index) => `${prefix}:step-link-${index + 1}`),
} as const
