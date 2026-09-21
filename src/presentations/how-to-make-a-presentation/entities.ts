export const ENTITIES = {
  you: 'how-to:you',
  prompt: 'how-to:prompt',
  skill: 'how-to:skill',
  conversation: 'how-to:conversation',
  question: 'how-to:question',
  tray: 'how-to:tray',
  ghost: 'how-to:ghost',
  depth: 'how-to:depth',
  kit: 'how-to:kit',
  verify: 'how-to:verify',
  modify: 'how-to:modify',
  route: 'how-to:route',
  reveal: 'how-to:reveal',
} as const

export const cardId = (index: number) => `how-to:step-card:${index}`
export const cardLinkId = (index: number) => `how-to:step-link:${index}`
