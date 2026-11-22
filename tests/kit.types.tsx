import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function Typed({payload}: SceneProps<{value:number}>) { return <span>{payload.value}</span> }
const typedSteps: Step<{value:number}>[] = [{id:'one',era:'era',title:'Title',caption:'Caption',Scene:Typed,payload:{value:1},groupKey:'group'}]
export const valid = <Presentation steps={typedSteps} title="Typed" />
// @ts-expect-error Payload is strongly typed through the public Presentation boundary.
export const invalid = <Presentation<{value:string}> steps={typedSteps} title="Invalid" />
// @ts-expect-error Each step requires narration and identity.
export const missing: Step<{value:number}> = {Scene:Typed,payload:{value:1}}
