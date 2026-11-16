import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
function TypedScene({ payload }: SceneProps<{ count: number }>) { return <div>{payload.count}</div> }
const valid: Step<{ count: number }>[] = [{ id: 'one', era: 'era', title: 'title', caption: 'caption', Scene: TypedScene, groupKey: 'g', payload: { count: 1 } }]
export const boundary = <Presentation title="Typed" steps={valid} />
// @ts-expect-error A scene step must carry narration and identity.
const incomplete: Step<{ count: number }> = { Scene: TypedScene, payload: { count: 1 } }
// @ts-expect-error Payloads remain typed at the Presentation boundary.
export const invalid = <Presentation<{ count: number }> title="Typed" steps={[{ ...valid[0], payload: { count: 'wrong' } }]} />
void incomplete
