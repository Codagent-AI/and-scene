// Compiled by tests/tsconfig.json; negative assertions must continue to be errors.
import type { Step, SceneProps } from '../src/presentation-kit/types'
import { Presentation } from '../src/presentation-kit/Presentation'
const Scene = ({ payload }: SceneProps<{ label: string }>) => <div>{payload.label}</div>
const steps: Step<{ label: string }>[] = [{ id: 'one', era: 'start', title: 'Title', caption: 'Caption', groupKey: 'group', Scene, payload: { label: 'typed' } }]
export const valid = <Presentation steps={steps} title="Typed" />
// @ts-expect-error incompatible payload is rejected
export const invalidPayload: Step<{ label: string }> = { ...steps[0], payload: 2 }
// @ts-expect-error required identity cannot be omitted
export const missingIdentity: Step<{ label: string }> = { era: 'start', title: 'Title', caption: 'Caption', Scene, payload: { label: 'typed' } }
// @ts-expect-error different payload at Presentation boundary is rejected
export const invalidBoundary = <Presentation<number> steps={steps} title="Invalid" />
