import { Box, SceneLayer } from '../../src/presentation-kit/index.ts'
import type { SceneProps, Step } from '../../src/presentation-kit/index.ts'

export interface P {
  items: string[]
}

export function ItemsScene({ payload, step }: SceneProps<P>) {
  return (
    <SceneLayer>
      {payload.items.map((id, i) => (
        <Box key={id} layoutId={id} x={i * 100} y={10} w={80} h={40}>
          {id}@{step.id}
        </Box>
      ))}
    </SceneLayer>
  )
}

export function makeSteps(specs: { id: string; era: string; items?: string[]; group?: string }[]): Step<P>[] {
  return specs.map((s) => ({
    id: s.id,
    era: s.era,
    title: `Title ${s.id}`,
    caption: `Caption ${s.id}`,
    Scene: ItemsScene,
    payload: { items: s.items ?? [s.id] },
    groupKey: s.group,
  }))
}

export const FIVE = makeSteps([
  { id: 'a', era: 'one', items: ['x'], group: 'g' },
  { id: 'b', era: 'one', items: ['x', 'y'], group: 'g' },
  { id: 'c', era: 'two', items: ['x', 'y', 'z'], group: 'g' },
  { id: 'd', era: 'two', items: ['y'], group: 'g' },
  { id: 'e', era: 'three', items: ['y'], group: 'g' },
])
