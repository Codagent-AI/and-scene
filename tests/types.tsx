import { Presentation } from '../src/presentation-kit/Presentation'
import type { Step, SceneProps } from '../src/presentation-kit/types'
type Payload = { count: number }
function TypedScene({ payload }: SceneProps<Payload>) { return <span>{payload.count}</span> }
const typed: Step<Payload>[] = [{ id: 'one', era: 'era', title: 'title', caption: 'caption', Scene: TypedScene, groupKey: 'group', payload: { count: 1 } }]
export const valid = <Presentation title="typed" steps={typed} />
// @ts-expect-error missing caption is rejected
export const missing: Step<Payload> = { id: 'bad', era: 'era', title: 'bad', Scene: TypedScene, payload: { count: 1 } }
// @ts-expect-error payload type must match the scene
export const invalid: Step<Payload> = { id: 'bad', era: 'era', title: 'bad', caption: 'bad', Scene: TypedScene, payload: { count: 'wrong' } }
