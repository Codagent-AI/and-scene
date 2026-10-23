import type { ComponentType } from 'react'
import { expectTypeOf, it } from 'vitest'
import { Presentation } from '../Presentation'
import type { SceneProps, Step } from '../types'

interface Grouped {
  lines: string[]
  emphasis: 'low' | 'high'
}

const GroupedScene: ComponentType<SceneProps<Grouped>> = () => null

// Type-level checks: `tsc` in `npm run build` compiles this file, so the assertions below fail the
// build if the payload type is lost or a mismatch is accepted.
const grouped: Step<Grouped>[] = [
  { id: 'a', era: 'one', title: 'A', caption: 'A caption', Scene: GroupedScene, groupKey: 'g', payload: { lines: [], emphasis: 'low' } },
  { id: 'b', era: 'one', title: 'B', caption: 'B caption', Scene: GroupedScene, groupKey: 'g', payload: { lines: ['x'], emphasis: 'high' } },
]

it('keeps the grouped payload type through Step, SceneProps, and Presentation without casts', () => {
  expectTypeOf<Step<Grouped>['payload']>().toEqualTypeOf<Grouped>()
  expectTypeOf<SceneProps<Grouped>['payload']>().toEqualTypeOf<Grouped>()
  expectTypeOf(Presentation<Grouped>).parameter(0).toHaveProperty('steps')
  const view = <Presentation steps={grouped} title="Typed" />
  expectTypeOf(view).not.toBeAny()
})

it('rejects a payload that does not match its Scene', () => {
  // @ts-expect-error the payload shape does not satisfy GroupedScene
  const mismatched: Step<{ lines: number }> = { id: 'c', era: 'one', title: 'C', caption: 'C', Scene: GroupedScene, payload: { lines: 1 } }
  expectTypeOf(mismatched).not.toBeAny()
})
