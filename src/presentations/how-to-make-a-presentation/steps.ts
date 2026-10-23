import type { Step } from '../../presentation-kit'
import { OUTLINE } from './outline'
import { SampleScene } from './SampleScene'
import { EMPTY_STATE, visibleEntities, type SamplePayload, type SampleState } from './state'

/** What each step adds to the scene. Later steps keep everything earlier steps showed. */
const ADDITIONS: readonly Partial<SampleState>[] = [
  { you: true, prompt: true },
  { skill: true, link: true, question: true },
  { cards: 1 },
  { cards: 3, morph: true },
  { ghost: true, control: true },
  { socket: true },
  { verify: true, verifyPassed: true },
  { modify: true, flagged: true },
  { reveal: true },
]

const STATES: readonly SampleState[] = ADDITIONS.reduce<SampleState[]>(
  (states, addition) => [...states, { ...(states.at(-1) ?? EMPTY_STATE), ...addition }],
  [],
)

/** Entities that are on screen in `next` but were not in `previous`. */
function arriving(previous: SampleState | null, next: SampleState): SamplePayload['entering'] {
  const before = new Set(previous ? visibleEntities(previous) : [])
  return visibleEntities(next).filter((id) => !before.has(id))
}

/** The nine sample steps. All share one group and one scene, so entities persist. */
export const SAMPLE_STEPS: readonly Step<SamplePayload>[] = OUTLINE.map((step, index) => {
  const state = STATES[index] ?? EMPTY_STATE
  return {
    id: step.id,
    era: step.era,
    title: step.title,
    caption: step.caption,
    groupKey: 'sample',
    scene: SampleScene,
    payload: { state, entering: arriving(STATES[index - 1] ?? null, state) },
  }
})
