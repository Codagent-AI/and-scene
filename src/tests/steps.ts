import type { Step } from '../presentation-kit'
import { CounterScene, OtherScene } from './fixtures'

const base = { caption: 'caption text' }

// Heterogeneous typed payloads, passed to <Presentation> with no casts.
export const typedSteps = [
  { ...base, id: 'a', era: 'One', title: 'A', Scene: CounterScene, payload: { label: 'a' }, groupKey: 'g' } satisfies Step<{ label: string }>,
  { ...base, id: 'b', era: 'One', title: 'B', Scene: CounterScene, payload: { label: 'b' }, groupKey: 'g' } satisfies Step<{ label: string }>,
  { ...base, id: 'c', era: 'Two', title: 'C', Scene: OtherScene, payload: { n: 3 } } satisfies Step<{ n: number }>,
]
