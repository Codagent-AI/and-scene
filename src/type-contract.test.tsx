import { Presentation } from './presentation-kit/Presentation'
import type { SceneProps, Step } from './presentation-kit/types'
function TypedScene({ payload }: SceneProps<{ label: string }>) { return <span>{payload.label}</span> }
const steps: Step<{ label: string }>[] = [{ id: 'one', era: 'start', title: 'One', caption: 'A paragraph.', Scene: TypedScene, groupKey: 'group', payload: { label: 'typed' } }]
export const typedBoundary = <Presentation steps={steps} title="Typed" />
// @ts-expect-error payload must retain its concrete label type
export const badPayload: Step<{ label: string }> = { ...steps[0], payload: { label: 1 } }
// @ts-expect-error required narration cannot be omitted
export const missingNarration: Step<{ label: string }> = { id: 'bad', Scene: TypedScene, payload: { label: 'x' } }
