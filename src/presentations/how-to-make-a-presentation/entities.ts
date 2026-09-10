const prefix = 'how-to-make-a-presentation'

export const entities = {
  you: `${prefix}:you`,
  prompt: `${prefix}:prompt`,
  skill: `${prefix}:skill`,
  question: `${prefix}:question`,
  conversation: `${prefix}:conversation`,
  tray: `${prefix}:tray`,
  kit: `${prefix}:scene-kit`,
  verify: `${prefix}:verify`,
  modify: `${prefix}:modify`,
  edited: `${prefix}:edited`,
  reveal: `${prefix}:reveal`,
  card: (index: number) => `${prefix}:step-card-${index}`,
  ghost: `${prefix}:ghost-card`,
  depth: `${prefix}:depth-control`,
} as const
