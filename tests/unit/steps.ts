import type { Step } from '../../src/presentation-kit'
import { CounterScene, type CounterPayload } from './scenes'

export function makeSteps(count: number, grouped = true): Step<CounterPayload>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    era: i < 2 ? 'first' : 'second',
    title: `Title ${i + 1}`,
    caption: `Caption ${i + 1}`,
    Scene: CounterScene,
    payload: { n: i + 1 },
    groupKey: grouped ? 'g' : undefined,
  }))
}
