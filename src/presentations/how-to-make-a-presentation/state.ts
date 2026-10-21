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

/** The keys in `next` that were not on screen in `previous`. */
export function newcomerKeys(previous: readonly string[], next: readonly string[]): Set<string> {
  const before = new Set(previous)
  return new Set(next.filter((key) => !before.has(key)))
}
