const prefix = 'how-to-make-a-presentation'
export const ENTITIES = {
  you: `${prefix}:you`, prompt: `${prefix}:prompt`, skill: `${prefix}:skill`, conversation: `${prefix}:conversation`, question: `${prefix}:question`,
  tray: `${prefix}:tray`, morph: `${prefix}:morph`, ghost: `${prefix}:ghost`, depth: `${prefix}:depth`, kit: `${prefix}:kit`, kitStem: `${prefix}:kit-stem`, verify: `${prefix}:verify`, verifyConnector: `${prefix}:verify-connector`,
  modify: `${prefix}:modify`, edited: `${prefix}:edited`, reveal: `${prefix}:reveal`,
  cards: Array.from({ length: 5 }, (_, index) => `${prefix}:card-${index + 1}`),
} as const
