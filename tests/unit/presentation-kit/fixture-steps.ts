import { Counter, Diagram, type CounterPayload } from './fixtures'
import type { Step } from '../../../src/presentation-kit'

// Test-only presentation steps. Never registered in src/presentations.
export const FIXTURE_STEPS: Step<CounterPayload>[] = [
  {
    id: 'first',
    era: 'Setup',
    title: 'First counter',
    caption: 'The counter starts at one.',
    groupKey: 'counter',
    scene: Counter,
    payload: { count: 1, label: 'one' },
  },
  {
    id: 'second',
    era: 'Setup',
    title: 'Second counter',
    caption: 'The same scene updates in place.',
    groupKey: 'counter',
    scene: Counter,
    payload: { count: 2, label: 'two' },
  },
  {
    id: 'diagram',
    era: 'Shapes',
    title: 'Diagram step',
    caption: 'A non-grouped step cross-fades.',
    scene: Diagram,
    payload: { count: 0, label: 'diagram' },
  },
]
