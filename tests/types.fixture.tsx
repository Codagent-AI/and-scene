import { Presentation, type SceneProps, type Step } from '../src/presentation-kit'
function Typed({ payload }: SceneProps<{ count: number }>) { return <span>{payload.count}</span> }
const steps: Step<{ count: number }>[] = [{ id:'typed',era:'example',title:'Typed',caption:'Typed payload.',Scene:Typed,groupKey:'typed',payload:{count:1} }]
export const valid = <Presentation steps={steps} title="Typed" />
// @ts-expect-error A string payload cannot satisfy the typed Scene.
export const invalid: Step<{count:number}> = { ...steps[0], payload: 'bad' }
// @ts-expect-error The presentation boundary rejects conflicting generic payloads.
export const invalidBoundary = <Presentation<string> steps={steps} title="Wrong" />
