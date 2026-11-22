import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
function Scene({ payload }: SceneProps<{ label: string }>) {
  return <div>{payload.label}</div>
}
const steps: Step<{ label: string }>[] = [
  {
    id: 'a',
    era: 'era',
    title: 'title',
    caption: 'caption',
    groupKey: 'same',
    Scene,
    payload: { label: 'typed' },
  },
]
export const valid = <Presentation steps={steps} title="Typed" />
// @ts-expect-error Payload must preserve the declared scene contract.
export const invalid = <Presentation<number> steps={steps} title="Invalid" />
// @ts-expect-error Steps must carry captions.
export const missingCaption: Step<{ label: string }> = {
  id: 'bad',
  era: 'era',
  title: 'title',
  Scene,
  payload: { label: 'x' },
}
