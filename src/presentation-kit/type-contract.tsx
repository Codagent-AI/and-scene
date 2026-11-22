// Compiled with the application: preserve grouped payload inference at the host boundary.
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
function TypedScene({ payload }: SceneProps<{ label: string }>) { return <span>{payload.label}</span> }
const typedSteps: Step<{ label: string }>[] = [{ id: 'typed', era: 'type contract', title: 'Typed', caption: 'Strong payload inference.', Scene: TypedScene, payload: { label: 'accepted' }, groupKey: 'typed' }]
export const typedBoundary = <Presentation steps={typedSteps} title="Typed contract" />
// @ts-expect-error A label must remain a string through the scene contract.
export const rejectedPayload: Step<{ label: string }> = { ...typedSteps[0], payload: { label: 123 } }
