import { Presentation } from '../src/presentation-kit/Presentation'
import type { Step, SceneProps } from '../src/presentation-kit/types'
function Scene({ payload }: SceneProps<{ label: string }>) { return <div>{payload.label}</div> }
const typed: Step<{ label: string }>[] = [{ id:'x',era:'a',title:'Title',caption:'Caption',groupKey:'g',Scene,payload:{label:'typed'} }]
export const valid = <Presentation steps={typed} title="Typed" />
// @ts-expect-error typed scene does not accept numeric payload
export const invalid: Step<{ label: string }> = { ...typed[0], payload: 10 }
