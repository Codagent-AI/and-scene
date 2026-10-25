import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
function Typed({ payload }: SceneProps<{ label: string }>) { return <div>{payload.label}</div> }
const steps: readonly Step<{ label: string }>[] = [{ id: 'a', era: 'one', title: 'Title', caption: 'Caption', Scene: Typed, payload: { label: 'safe' }, groupKey: 'typed' }]
export const valid = <Presentation title="Typed" steps={steps} />
// @ts-expect-error Wrong payload cannot cross a typed Presentation boundary.
export const invalid = <Presentation<{ label: number }> title="Invalid" steps={steps} />
// @ts-expect-error Step metadata is mandatory.
export const missing: Step = { id: 'missing' }
// @ts-expect-error A grouped scene requires its typed payload.
export const badPayload: Step<{ label: string }> = { ...steps[0], payload: { label: 123 } }
