/** The diagram state for one step. Every field is cumulative: later steps only add. */
export interface SceneState {
  skill: boolean
  /** Number of step cards in the tray (0–4). */
  cards: number
  /** Number of links shown between consecutive tray items (0–5). */
  links: number
  ghost: boolean
  control: boolean
  kit: boolean
  verify: boolean
  modify: boolean
  frame: boolean
}

/** What a step hands the scene: its state, and the state it follows (so the scene can tell newcomers from continuing entities). */
export interface Beat {
  state: SceneState
  previous: SceneState | null
}

export const START: SceneState = {
  skill: false,
  cards: 0,
  links: 0,
  ghost: false,
  control: false,
  kit: false,
  verify: false,
  modify: false,
  frame: false,
}
