import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'

interface Payload { label: string; count: number }

function Diagram({ payload }: SceneProps<Payload>) {
  return <span>{payload.label.toUpperCase()} {payload.count.toFixed()}</span>
}

const steps: readonly Step<Payload>[] = [
  { id: 'a', era: 'era', title: 'A', caption: 'Caption', Scene: Diagram, groupKey: 'group', payload: { label: 'A', count: 1 } },
  { id: 'b', era: 'era', title: 'B', caption: 'Caption', Scene: Diagram, groupKey: 'group', payload: { label: 'B', count: 2 } },
]

export function Host() {
  return <Presentation steps={steps} title="Typed group" />
}

export function Invalid() {
  // @ts-expect-error The host must reject a payload that cannot reach the scene safely.
  return <Presentation<Payload> steps={[{ ...steps[0], payload: { label: 'C' } }]} title="Wrong payload" />
}
