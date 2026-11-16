import type { Step, SceneProps } from '../src/presentation-kit/types'
import { Presentation } from '../src/presentation-kit/Presentation'
function TypedScene({ payload }: SceneProps<{ name: string }>) { return <p>{payload.name}</p> }
const steps: Step<{ name: string }>[] = [{ id: 'x', era: 'e', title: 'T', caption: 'C', groupKey: 'g', Scene: TypedScene, payload: { name: 'typed' } }]
export const accepted = <Presentation steps={steps} title="Typed" />
// @ts-expect-error A number is incompatible with the scene's strongly typed payload.
export const rejected: Step<{ name: string }> = { ...steps[0], payload: 42 }
