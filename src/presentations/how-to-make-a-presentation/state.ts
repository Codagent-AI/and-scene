/** Cumulative diagram state of one sample step. Entities accumulate; none move back. */
export interface SampleState {
  you: boolean
  prompt: boolean
  skill: boolean
  link: boolean
  question: boolean
  cards: number
  morph: boolean
  ghost: boolean
  control: boolean
  socket: boolean
  verify: boolean
  verifyPassed: boolean
  modify: boolean
  flagged: boolean
  reveal: boolean
}

export const EMPTY_STATE: SampleState = {
  you: false,
  prompt: false,
  skill: false,
  link: false,
  question: false,
  cards: 0,
  morph: false,
  ghost: false,
  control: false,
  socket: false,
  verify: false,
  verifyPassed: false,
  modify: false,
  flagged: false,
  reveal: false,
}

/** Stable entity identities. These double as Motion layoutIds for the sample. */
export type EntityId =
  | 'you'
  | 'prompt'
  | 'skill'
  | 'link'
  | 'question'
  | 'card-1'
  | 'card-2'
  | 'card-3'
  | 'morph-arrow'
  | 'morph-label'
  | 'ghost'
  | 'control'
  | 'socket'
  | 'chain'
  | 'verify'
  | 'modify-arc'
  | 'modify-label'
  | 'flag'
  | 'reveal'

/** Entities present in a state, in render order. */
export function visibleEntities(state: SampleState): EntityId[] {
  const present: [EntityId, boolean][] = [
    ['you', state.you],
    ['prompt', state.prompt],
    ['skill', state.skill],
    ['link', state.link],
    ['question', state.question],
    ['card-1', state.cards >= 1],
    ['card-2', state.cards >= 2],
    ['card-3', state.cards >= 3],
    ['morph-arrow', state.morph],
    ['morph-label', state.morph],
    ['ghost', state.ghost],
    ['control', state.control],
    ['socket', state.socket],
    ['chain', state.verify],
    ['verify', state.verify],
    ['modify-arc', state.modify],
    ['modify-label', state.modify],
    ['flag', state.flagged],
    ['reveal', state.reveal],
  ]
  return present.filter(([, on]) => on).map(([id]) => id)
}

/** Payload of every sample step: the diagram state the scene should show. */
export interface SamplePayload {
  state: SampleState
}
