/* eslint-disable react-refresh/only-export-components -- compile-only public API fixture */
import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function TypedScene({ payload }: SceneProps<{ count: number }>) { return <div>{payload.count}</div> }
const steps: Step<{ count: number }>[] = [{ id: 'typed', era: 'era', title: 'title', caption: 'caption', Scene: TypedScene, groupKey: 'typed', payload: { count: 1 } }]
export const valid = <Presentation steps={steps} title="Typed" />
// @ts-expect-error payload must keep its strong type
export const invalid = <Presentation<{ count: string }> steps={steps} title="Wrong" />
// @ts-expect-error every step requires narration and stable identity
export const incomplete: Step<{ count: number }> = { Scene: TypedScene, payload: { count: 1 } }
