import { Presentation } from '../src/presentation-kit/Presentation'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function TypedScene({payload}:SceneProps<{value:number}>){return <span>{payload.value}</span>}
const typed:Step<{value:number}>[]=[{id:'x',era:'x',title:'x',caption:'x',Scene:TypedScene,payload:{value:1},groupKey:'x'}]
export const valid=<Presentation steps={typed} title="Typed"/>
// @ts-expect-error incompatible payload must not cross the presentation boundary
export const invalid=<Presentation<string> steps={typed} title="Invalid"/>
import { Box } from '../src/presentation-kit/nodes/Box'
export const primitive=<Box id="typed"><span>Child</span></Box>
// @ts-expect-error steps must supply stable identity and narration
export const missing:Step<number>={Scene:({payload})=><span>{payload}</span>,payload:1}
