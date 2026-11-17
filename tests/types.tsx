import { Presentation } from '../src/presentation-kit'
import type { Step, SceneProps } from '../src/presentation-kit'
interface Payload { amount: number }
function TypedScene({ payload }: SceneProps<Payload>) { return <span>{payload.amount.toFixed(2)}</span> }
const steps: Step<Payload>[] = [{ id: 'typed', era: 'e', title: 'T', caption: 'C', groupKey: 'g', Scene: TypedScene, payload: { amount: 2 } }]
export const valid = <Presentation steps={steps} title="typed" />
// @ts-expect-error wrong payload must not pass the presentation boundary
export const invalid = <Presentation<string> steps={steps} title="wrong" />
// @ts-expect-error payload must match the Scene contract
export const wrong: Step<Payload> = { ...steps[0], payload: { amount: 'wrong' } }
