import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'

interface Payload { phase: 'question' | 'answer'; count: number }
function TypedScene({ payload }: SceneProps<Payload>) { return <output>{payload.phase}: {payload.count}</output> }
export const typedSteps: Step<Payload>[] = [
  { id: 'one', era: 'ask', title: 'A question', caption: 'First paragraph.', Scene: TypedScene, groupKey: 'dialogue', payload: { phase: 'question', count: 1 } },
  { id: 'two', era: 'ask', title: 'An answer', caption: 'Second paragraph.', Scene: TypedScene, groupKey: 'dialogue', payload: { phase: 'answer', count: 2 } },
]
export const typedPresentation = <Presentation steps={typedSteps} title="Typed grouped payloads" />
// @ts-expect-error A typed scene cannot receive a string where its count is numeric.
export const incompatibleStep: Step<Payload> = { ...typedSteps[0], payload: { phase: 'answer', count: 'two' } }
// @ts-expect-error Step metadata must include the stable identity, era, title and caption.
export const missingMetadata: Step<Payload> = { Scene: TypedScene, payload: { phase: 'answer', count: 2 } }

function StringScene({ payload }: SceneProps<string>) { return <output>{payload}</output> }
const incompatibleSteps: Step<string>[] = [{ id: 'wrong', era: 'ask', title: 'Wrong payload', caption: 'A string payload.', Scene: StringScene, payload: 'wrong' }]
// @ts-expect-error The public generic boundary rejects a scene array with an incompatible payload.
export const incompatiblePresentation = <Presentation<Payload> steps={incompatibleSteps} title="Wrong payload" />
