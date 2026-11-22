import { Presentation } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
function Scene({payload}:SceneProps<{count:number}>){return <div>{payload.count}</div>}
const steps:Step<{count:number}>[]=[{id:'typed',era:'era',title:'Title',caption:'Caption',Scene,groupKey:'typed',payload:{count:1}}]
export const correct=<Presentation title="Typed" steps={steps} />
// @ts-expect-error payload count must be a number
export const invalid:Step<{count:number}>={...steps[0],payload:{count:'wrong'}}
// @ts-expect-error Presentation boundary preserves the declared payload
export const invalidBoundary=<Presentation<string> title="Wrong" steps={steps} />
