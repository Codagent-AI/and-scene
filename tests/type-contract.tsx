import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
type Payload = { count: number; emphasis: 'normal' | 'strong' }
function Diagram({ payload }: SceneProps<Payload>) { return <div>{payload.count} {payload.emphasis}</div> }
const typed: Step<Payload>[] = [{ id: 'typed', era: 'era', title: 'Title', caption: 'Caption', Scene: Diagram, payload: { count: 1, emphasis: 'normal' }, groupKey: 'same' }]
export const valid = <Presentation steps={typed} title="Typed" />
// @ts-expect-error Payload types must remain checked at the boundary.
export const invalid = <Presentation<string> steps={typed} title="Wrong" />
