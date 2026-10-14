// This presentation's layoutId namespace. Each id names one entity for the whole
// talk: a persisting entity keeps its id from the step it appears in onward, and
// no two entities share one. Ids are prefixed so they cannot collide with another
// presentation's layout ids.
const NS = 'how-to'

export const ENTITY = {
  you: `${NS}:you`,
  prompt: `${NS}:prompt`,
  question: `${NS}:question`,
  skill: `${NS}:skill`,
  ask: `${NS}:ask`,
  answer: `${NS}:answer`,
  tray: `${NS}:tray`,
  card1: `${NS}:card-1`,
  card2: `${NS}:card-2`,
  card3: `${NS}:card-3`,
  link1: `${NS}:link-1`,
  link2: `${NS}:link-2`,
  ghost: `${NS}:ghost`,
  depth: `${NS}:depth`,
  kit: `${NS}:kit`,
  plug: `${NS}:plug`,
  verify: `${NS}:verify`,
  chain: `${NS}:chain`,
  modify: `${NS}:modify`,
  reveal: `${NS}:reveal`,
  revealLabel: `${NS}:reveal-label`,
} as const
