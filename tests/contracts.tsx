import { Presentation } from '../src/presentation-kit/Presentation'
import type { Step, SceneProps } from '../src/presentation-kit/types'
function Scene({ payload }: SceneProps<{ count: number }>) { return <span>{payload.count}</span> }
const steps: Step<{ count: number }>[] = [{ id: 'one', era: 'era', title: 'Title', caption: 'Caption', Scene, payload: { count: 1 }, groupKey: 'group' }]
export const positive = <Presentation steps={steps} title="Typed" />
// @ts-expect-error incompatible grouped payload is rejected
export const negative = <Presentation<{ count: string }> steps={steps} title="Typed" />
// @ts-expect-error scene payload must match the declared payload type
export const badPayload: Step<{ count: number }> = { ...steps[0], payload: { count: 'bad' } }
// @ts-expect-error required narration and identity fields cannot be omitted
export const incomplete: Step<{ count: number }> = { Scene, payload: {count: 0} }
