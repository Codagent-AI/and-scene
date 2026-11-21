import { Presentation } from '../../src/presentation-kit'
import type { SceneProps, Step } from '../../src/presentation-kit'

interface Quantity {
  items: number
}

function Scene({ payload }: SceneProps<Quantity>) {
  // @ts-expect-error A typed payload rejects assigning a numeric value to a string.
  const label: string = payload.items
  return <div>{label}: {payload.items.toFixed(0)}</div>
}

const steps: Step<Quantity>[] = [
  { id: 'one', era: 'Count', title: 'One item', caption: 'Start here.', groupKey: 'count', Scene, payload: { items: 1 } },
  { id: 'two', era: 'Count', title: 'Two items', caption: 'Add one.', groupKey: 'count', Scene, payload: { items: 2 } },
]

export function TypedSceneFixture() {
  return <Presentation title="Typed scenes" steps={steps} />
}
