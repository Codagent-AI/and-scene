const prefix = 'how-to-make-a-presentation'

export const entities = {
  askArrow: `${prefix}:ask-arrow`,
  depth: `${prefix}:depth`,
  frame: `${prefix}:reveal-frame`,
  kit: `${prefix}:scene-kit`,
  modify: `${prefix}:modify-arc`,
  prompt: `${prefix}:prompt`,
  question: `${prefix}:question`,
  skill: `${prefix}:skill`,
  tray: `${prefix}:tray`,
  verify: `${prefix}:verify`,
  you: `${prefix}:you`,
  card: (index: number) => `${prefix}:step-card-${index}`,
  cardLink: (index: number) => `${prefix}:step-link-${index}`,
  cardLabel: (index: number) => `${prefix}:step-card-label-${index}`,
} as const
