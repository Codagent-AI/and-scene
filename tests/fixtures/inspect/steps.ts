import type { Step } from '../../../src/presentation-kit'
import { FixtureScene, type FixturePayload } from './FixtureScene'

export const STEPS: Step<FixturePayload>[] = [1, 2, 3].map((n) => ({
  id: `fixture-${n}`,
  era: n === 1 ? 'one' : 'two',
  title: `Fixture ${n}`,
  caption: `Fixture caption ${n}`,
  Scene: FixtureScene,
  payload: { step: n },
  groupKey: 'fixture',
}))
